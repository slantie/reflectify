import { createHash } from "node:crypto"

import postgres from "postgres"

type Row = Record<string, unknown>

const APPLY = process.argv.includes("--apply")
const READ_BATCH_SIZE = 10_000
const WRITE_BATCH_SIZE = 500
const sourceUrl = process.env.LEGACY_DATABASE_URL
const targetUrl = process.env.DATABASE_URL
const phaseIndex = process.argv.indexOf("--phase")
const phase = phaseIndex === -1 ? "all" : process.argv[phaseIndex + 1]
const phases = new Set(["all", "core", "foundation", "access", "metadata", "answers", "snapshots", "verify"])
const snapshotAfterIdIndex = process.argv.indexOf("--snapshot-after-id")
const snapshotAfterId = snapshotAfterIdIndex === -1 ? "" : process.argv[snapshotAfterIdIndex + 1] ?? ""
const snapshotBatchLimitIndex = process.argv.indexOf("--snapshot-batches")
const snapshotBatchLimit =
  snapshotBatchLimitIndex === -1 ? Number.POSITIVE_INFINITY : Number(process.argv[snapshotBatchLimitIndex + 1])

if (process.argv.includes("--help")) {
  console.log(
    "Usage: LEGACY_DATABASE_URL=<restored legacy database> DATABASE_URL=<Neon target> pnpm db:import-legacy -- --apply --phase <foundation|access|metadata|answers|snapshots|verify|all> [--snapshot-after-id <id> --snapshot-batches <count>]"
  )
  process.exit(0)
}

if (!sourceUrl || !targetUrl) {
  throw new Error("LEGACY_DATABASE_URL and DATABASE_URL are required.")
}
if (!phases.has(phase)) {
  throw new Error(`Unknown import phase: ${phase}`)
}
if (snapshotBatchLimitIndex !== -1 && (!Number.isInteger(snapshotBatchLimit) || snapshotBatchLimit < 1)) {
  throw new Error("--snapshot-batches must be a positive integer.")
}

const source = postgres(sourceUrl, { max: 1, prepare: false })
const target = postgres(targetUrl, { max: 1, prepare: false })

const copiedTables = [
  "academic_years",
  "admins",
  "analytics_views",
  "colleges",
  "custom_reports",
  "departments",
  "division_timetables",
  "divisions",
  "faculties",
  "feedback_form_overrides",
  "feedback_questions",
  "promotion_history",
  "question_categories",
  "semesters",
  "students",
  "subject_allocations",
] as const

const importOrder = [
  "academic_years",
  "colleges",
  "admins",
  "analytics_views",
  "custom_reports",
  "departments",
  "question_categories",
  "semesters",
  "faculties",
  "divisions",
  "subjects",
  "students",
  "subject_allocations",
  "division_timetables",
  "feedback_forms",
  "feedback_form_overrides",
  "override_students",
  "form_access",
  "promotion_history",
  "feedback_questions",
] as const

const validIdentifiers = new Set([
  ...copiedTables,
  ...importOrder,
  "feedback_analytics",
  "feedback_answers",
  "feedback_snapshots",
  "feedback_submissions",
  "otps",
  "student_responses",
])

function quotedIdentifier(identifier: string) {
  if (!validIdentifiers.has(identifier)) throw new Error(`Unexpected table identifier: ${identifier}`)
  return `"${identifier}"`
}

function stableUuid(seed: string) {
  const hex = createHash("sha256").update(seed).digest("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(
    Number.parseInt(hex.slice(16, 18), 16) & 0x3f
  )
    .toString(16)
    .padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20, 32)}`
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function asJson(value: unknown) {
  return JSON.stringify(parseJson(value))
}

function numericRating(value: unknown): string | null {
  const parsed = parseJson(value)
  const candidate =
    typeof parsed === "object" && parsed !== null && "score" in parsed
      ? (parsed as { score: unknown }).score
      : parsed
  const numeric = typeof candidate === "number" ? candidate : Number(candidate)
  return Number.isFinite(numeric) ? numeric.toFixed(2) : null
}

function participantKey(row: Row) {
  const formId = String(row.feedback_form_id ?? row.form_id)
  const studentId = row.student_id == null ? null : String(row.student_id)
  const overrideStudentId = row.override_student_id == null ? null : String(row.override_student_id)

  if ((studentId === null) === (overrideStudentId === null)) {
    throw new Error(`Legacy response group for form ${formId} has an invalid participant reference.`)
  }

  return studentId ? `${formId}:student:${studentId}` : `${formId}:override:${overrideStudentId}`
}

async function fetchBatches(table: string, handler: (rows: Row[]) => Promise<void>) {
  let lastId = ""
  while (true) {
    const rows = (await source.unsafe(
      `SELECT * FROM public.${quotedIdentifier(table)} WHERE id > $1 ORDER BY id ASC LIMIT $2`,
      [lastId, READ_BATCH_SIZE]
    )) as Row[]
    if (rows.length === 0) return
    await handler(rows)
    lastId = String(rows.at(-1)?.id)
  }
}

async function upsertRows(table: string, rows: Row[]) {
  if (rows.length === 0) return
  if (!APPLY) return

  for (let offset = 0; offset < rows.length; offset += WRITE_BATCH_SIZE) {
    await upsertBatch(table, rows.slice(offset, offset + WRITE_BATCH_SIZE))
  }
}

async function upsertBatch(table: string, rows: Row[]) {
  if (rows.length === 0) return

  const columns = Object.keys(rows[0] ?? {}).sort()
  if (columns.length === 0) return
  if (rows.some((row) => columns.some((column) => !(column in row)))) {
    throw new Error(`Inconsistent row shape while importing ${table}.`)
  }

  const placeholders = rows
    .map((_, rowIndex) => `(${columns.map((_, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`).join(", ")})`)
    .join(", ")
  const values = rows.flatMap((row) => columns.map((column) => row[column]))
  const columnSql = columns.map((column) => `"${column}"`).join(", ")
  const updateSql = columns
    .filter((column) => column !== "id")
    .map((column) => `"${column}" = EXCLUDED."${column}"`)
    .join(", ")
  const query = `INSERT INTO public.${quotedIdentifier(table)} (${columnSql}) VALUES ${placeholders} ON CONFLICT ("id") DO UPDATE SET ${updateSql}`

  await target.unsafe(query, values as never[])
}

async function copyTable(table: string, transform: (row: Row) => Row = (row) => row) {
  let count = 0
  await fetchBatches(table, async (rows) => {
    count += rows.length
    await upsertRows(table, rows.map(transform))
  })
  console.log(`${APPLY ? "Imported" : "Would import"} ${count} rows into ${table}`)
}

async function copyStandardTables(tables: readonly string[] = importOrder) {
  for (const table of tables) {
    if (copiedTables.includes(table as (typeof copiedTables)[number])) {
      await copyTable(table)
      continue
    }

    if (table === "subjects") {
      await copyTable("subjects")
      continue
    }

    if (table === "feedback_forms") {
      await copyTable("feedback_forms", (row) => ({
        id: row.id,
        division_id: row.division_id,
        subject_allocation_id: row.subject_allocation_id,
        title: row.title,
        description: row.description,
        start_date: row.start_date,
        end_date: row.end_date,
        is_expired: row.isExpired ?? false,
        status: row.status,
        access_hash: row.access_hash,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
      continue
    }

    if (table === "form_access") {
      await copyTable("form_access", (row) => ({
        id: row.id,
        form_id: row.formId,
        student_id: row.studentId,
        override_student_id: row.overrideStudentId,
        access_token: row.accessToken,
        is_submitted: row.isSubmitted,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
      continue
    }

    if (table === "override_students") {
      await copyTable("override_students", (row) => ({
        id: row.id,
        feedback_form_override_id: row.feedback_form_override_id,
        name: row.name,
        email: row.email,
        enrollment_number: row.enrollmentNumber,
        batch: row.batch,
        phoneNumber: row.phoneNumber,
        department: row.department,
        semester: row.semester,
        student_id: row.student_id,
        is_deleted: row.is_deleted,
      }))
    }
  }
}

async function importOtps() {
  await copyTable("otps", (row) => ({
    id: row.id,
    email: row.email,
    otp_hash: createHash("sha256").update(String(row.otp)).digest("hex"),
    purpose: "AUTH",
    expires_at: row.expires_at,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

async function importFeedbackAnalytics() {
  await copyTable("feedback_analytics", (row) => ({
    id: row.id,
    subject_allocation_id: row.subject_allocation_id,
    academic_year_id: row.academic_year_id,
    average_rating: row.average_rating,
    response_count: row.response_count,
    completion_rate: row.completion_rate,
    calculated_at: row.calculated_at,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

async function importSubmissionsAndAnswers() {
  const accessRows = (await source.unsafe(
    'SELECT id, "formId" AS form_id, "studentId" AS student_id, "overrideStudentId" AS override_student_id FROM public.form_access'
  )) as Row[]
  const accessByParticipant = new Map(accessRows.map((row) => [participantKey(row), String(row.id)]))
  const groups = (await source.unsafe(
    "SELECT feedback_form_id, student_id, override_student_id, MIN(submitted_at) AS submitted_at, BOOL_AND(is_deleted) AS is_deleted FROM public.student_responses GROUP BY feedback_form_id, student_id, override_student_id"
  )) as Row[]

  const submissionByParticipant = new Map<string, string>()
  const recoveredAccesses: Row[] = []
  const submissions = groups.map((group) => {
    const key = participantKey(group)
    let formAccessId = accessByParticipant.get(key)
    if (!formAccessId) {
      // A small number of old responses have no FormAccess row. Preserve their
      // answers without creating a usable login by adding an archived recipient.
      formAccessId = stableUuid(`recovered-form-access:${key}`)
      accessByParticipant.set(key, formAccessId)
      recoveredAccesses.push({
        id: formAccessId,
        form_id: group.feedback_form_id,
        student_id: group.student_id,
        override_student_id: group.override_student_id,
        access_token: `migrated-${formAccessId}`,
        is_submitted: true,
        is_deleted: true,
        created_at: group.submitted_at,
        updated_at: group.submitted_at,
      })
    }
    const id = stableUuid(`feedback-submission:${formAccessId}`)
    submissionByParticipant.set(key, id)
    return {
      id,
      form_access_id: formAccessId,
      submitted_at: group.submitted_at,
      is_deleted: group.is_deleted,
      created_at: group.submitted_at,
      updated_at: group.submitted_at,
    }
  })

  await upsertRows("form_access", recoveredAccesses)
  if (recoveredAccesses.length > 0) {
    console.log(`${APPLY ? "Imported" : "Would import"} ${recoveredAccesses.length} archived FormAccess recovery rows`)
  }
  await upsertRows("feedback_submissions", submissions)
  console.log(`${APPLY ? "Imported" : "Would import"} ${submissions.length} rows into feedback_submissions`)

  let answerCount = 0
  await fetchBatches("student_responses", async (rows) => {
    answerCount += rows.length
    const answers = rows.map((row) => {
      const submissionId = submissionByParticipant.get(participantKey(row))
      if (!submissionId) throw new Error(`No submission found for legacy response ${String(row.id)}.`)
      return {
        id: row.id,
        submission_id: submissionId,
        question_id: row.question_id,
        response_value: asJson(row.response_value),
        numeric_rating: numericRating(row.response_value),
        is_deleted: row.is_deleted,
        created_at: row.submitted_at,
        updated_at: row.submitted_at,
      }
    })
    await upsertRows("feedback_answers", answers)
  })
  console.log(`${APPLY ? "Imported" : "Would import"} ${answerCount} rows into feedback_answers`)
}

async function importSnapshots() {
  let afterId = snapshotAfterId
  let batchCount = 0
  let importedCount = 0

  while (batchCount < snapshotBatchLimit) {
    const rows = (await source.unsafe(
      `SELECT * FROM public."feedback_snapshots" WHERE id > $1 ORDER BY id ASC LIMIT $2`,
      [afterId, WRITE_BATCH_SIZE]
    )) as Row[]
    if (rows.length === 0) {
      console.log(`${APPLY ? "Imported" : "Would import"} ${importedCount} feedback_snapshots in this run; snapshot import is complete.`)
      return
    }

    const snapshots = rows.map((row) => {
      return {
        ...row,
        numeric_rating: numericRating(row.response_value),
        response_value: asJson(row.response_value),
      }
    })
    await upsertRows("feedback_snapshots", snapshots)
    importedCount += snapshots.length
    batchCount += 1
    afterId = String(rows.at(-1)?.id)
    console.log(`${APPLY ? "Imported" : "Would import"} ${importedCount} feedback_snapshots in this run.`)
  }

  console.log(`Snapshot import paused. Resume with --snapshot-after-id ${afterId} --snapshot-batches ${snapshotBatchLimit}.`)
}

async function verifyCounts() {
  const checks = [
    ["academic_years", "academic_years"],
    ["students", "students"],
    ["subject_allocations", "subject_allocations"],
    ["feedback_forms", "feedback_forms"],
    ["feedback_questions", "feedback_questions"],
    ["student_responses", "feedback_answers"],
    ["feedback_snapshots", "feedback_snapshots"],
  ] as const

  for (const [sourceTable, targetTable] of checks) {
    const sourceCount = Number((await source.unsafe(`SELECT COUNT(*)::int AS count FROM public.${quotedIdentifier(sourceTable)}`))[0]?.count)
    const targetCount = APPLY
      ? Number((await target.unsafe(`SELECT COUNT(*)::int AS count FROM public.${quotedIdentifier(targetTable)}`))[0]?.count)
      : sourceCount
    if (sourceCount !== targetCount) {
      throw new Error(`Count mismatch for ${sourceTable} -> ${targetTable}: ${sourceCount} != ${targetCount}`)
    }
    console.log(`Verified ${sourceTable} -> ${targetTable}: ${sourceCount} rows`)
  }
}

async function main() {
  console.log(`${APPLY ? "Starting idempotent legacy import." : "Dry run only; pass --apply to write to Neon."} Phase: ${phase}.`)
  if (phase === "all" || phase === "core" || phase === "foundation") {
    await copyStandardTables(importOrder.slice(0, importOrder.indexOf("form_access")))
  }
  if (phase === "all" || phase === "core" || phase === "access") {
    await copyStandardTables(["form_access"])
  }
  if (phase === "all" || phase === "core" || phase === "metadata") {
    await copyStandardTables(["promotion_history", "feedback_questions"])
    await importOtps()
    await importFeedbackAnalytics()
  }
  if (phase === "all" || phase === "answers") await importSubmissionsAndAnswers()
  if (phase === "all" || phase === "snapshots") await importSnapshots()
  if (phase === "all" || phase === "verify") await verifyCounts()
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await Promise.all([source.end(), target.end()])
  })
