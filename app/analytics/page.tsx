import {
  BookOpenIcon,
  ChartLineUpIcon,
  GraduationCapIcon,
  StarIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"
import { unstable_cache } from "next/cache"

import {
  type AnalyticsWorkspaceData,
  AnalyticsWorkspace,
  type BatchRating,
  type CategoryRating,
  type ComparisonRow,
  type FacultyRating,
  type FacultySemesterRating,
  type SemesterParticipation,
  type SubjectFacultyRating,
  type SubjectRating,
} from "@/components/analytics/analytics-workspace"
import { AnalyticsFilters } from "@/components/analytics/analytics-filters"
import { AnalyticsExport } from "@/components/analytics/analytics-export"
import {
  CompletionChart,
  ResponseDistributionChart,
} from "@/components/analytics/analytics-charts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Prisma } from "@/generated/neon"
import { prisma } from "@/lib/db"

type AnalyticsSearchParams = {
  year?: string
  department?: string
  semester?: string
  division?: string
  subject?: string
  teaching?: string
}

const snapshotSelect = {
  academicYearId: true,
  academicYearString: true,
  departmentId: true,
  departmentName: true,
  departmentAbbreviation: true,
  semesterId: true,
  semesterNumber: true,
  divisionId: true,
  divisionName: true,
  subjectId: true,
  subjectName: true,
  subjectAbbreviation: true,
  subjectCode: true,
  facultyId: true,
  facultyName: true,
  facultyAbbreviation: true,
  studentId: true,
  studentEnrollmentNumber: true,
  questionCategoryName: true,
  questionBatch: true,
  numericRating: true,
  batch: true,
} satisfies Prisma.FeedbackSnapshotSelect

type SnapshotRow = Prisma.FeedbackSnapshotGetPayload<{
  select: typeof snapshotSelect
}>

type RatingAccumulator = {
  total: number
  responses: number
  students: Set<string>
  subjects: Set<string>
  faculties: Set<string>
  divisions: Set<string>
}

type SubjectAccumulator = RatingAccumulator & {
  id: string
  label: string
  detail: string
  lectureTotal: number
  lectureResponses: number
  labTotal: number
  labResponses: number
}

type NamedAccumulator = RatingAccumulator & {
  id: string
  label: string
  detail: string
}

function readId(value: string | undefined, knownIds: Set<string>) {
  return value && value !== "all" && knownIds.has(value) ? value : undefined
}

function createAccumulator(): RatingAccumulator {
  return {
    total: 0,
    responses: 0,
    students: new Set(),
    subjects: new Set(),
    faculties: new Set(),
    divisions: new Set(),
  }
}

function normalizedText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function addRating(accumulator: RatingAccumulator, row: SnapshotRow) {
  const rating = Number(row.numericRating)
  if (!Number.isFinite(rating)) return
  accumulator.total += rating
  accumulator.responses += 1
  accumulator.students.add(row.studentId ?? row.studentEnrollmentNumber)
  accumulator.subjects.add(row.subjectId)
  accumulator.faculties.add(row.facultyId)
  accumulator.divisions.add(row.divisionId)
}

function isLabRating(row: SnapshotRow) {
  const category = normalizedText(row.questionCategoryName).toLowerCase()
  const batch = normalizedText(row.questionBatch).toLowerCase()
  return (
    category.includes("lab") ||
    category.includes("laboratory") ||
    (batch !== "" && batch !== "none" && batch !== "-")
  )
}

function getOrCreateNamed(
  map: Map<string, NamedAccumulator>,
  id: string,
  label: string,
  detail: string
) {
  const existing = map.get(id)
  if (existing) return existing
  const created = { id, label, detail, ...createAccumulator() }
  map.set(id, created)
  return created
}

function addComparison(
  target: Map<string, Map<string, RatingAccumulator>>,
  label: string,
  year: string,
  row: SnapshotRow
) {
  const perYear = target.get(label) ?? new Map<string, RatingAccumulator>()
  const aggregate = perYear.get(year) ?? createAccumulator()
  addRating(aggregate, row)
  perYear.set(year, aggregate)
  target.set(label, perYear)
}

function toComparisonRows(
  data: Map<string, Map<string, RatingAccumulator>>,
  years: string[]
): ComparisonRow[] {
  return [...data.entries()]
    .map(([label, values]) => {
      const ratings: Record<string, number> = {}
      const responses: Record<string, number> = {}
      years.forEach((year) => {
        const value = values.get(year)
        if (!value || value.responses === 0) return
        ratings[year] = Number((value.total / value.responses).toFixed(2))
        responses[year] = value.responses
      })
      return { label, values: ratings, responses }
    })
    .filter((row) => Object.keys(row.values).length > 0)
    .sort((first, second) => first.label.localeCompare(second.label))
}

function buildWorkspaceData(rows: SnapshotRow[]): AnalyticsWorkspaceData {
  const subjectMap = new Map<string, SubjectAccumulator>()
  const facultyMap = new Map<string, NamedAccumulator>()
  const facultySemesterMap = new Map<
    string,
    {
      id: string
      label: string
      detail: string
      semesters: Map<number, RatingAccumulator>
    }
  >()
  const subjectFacultyMap = new Map<string, Map<string, NamedAccumulator>>()
  const batchMap = new Map<string, NamedAccumulator>()
  const categoryMap = new Map<string, NamedAccumulator>()
  const departmentYears = new Map<string, Map<string, RatingAccumulator>>()
  const semesterYears = new Map<string, Map<string, RatingAccumulator>>()
  const divisionYears = new Map<string, Map<string, RatingAccumulator>>()
  const years = [...new Set(rows.map((row) => row.academicYearString))].sort()

  for (const row of rows) {
    const subject = subjectMap.get(row.subjectId) ?? {
      id: row.subjectId,
      label: row.subjectAbbreviation || row.subjectCode,
      detail: row.subjectName,
      ...createAccumulator(),
      lectureTotal: 0,
      lectureResponses: 0,
      labTotal: 0,
      labResponses: 0,
    }
    addRating(subject, row)
    if (isLabRating(row)) {
      subject.labTotal += Number(row.numericRating)
      subject.labResponses += 1
    } else {
      subject.lectureTotal += Number(row.numericRating)
      subject.lectureResponses += 1
    }
    subjectMap.set(row.subjectId, subject)

    const faculty = getOrCreateNamed(
      facultyMap,
      row.facultyId,
      row.facultyAbbreviation || row.facultyName,
      row.facultyName
    )
    addRating(faculty, row)

    const facultySemester = facultySemesterMap.get(row.facultyId) ?? {
      id: row.facultyId,
      label: row.facultyAbbreviation || row.facultyName,
      detail: row.facultyName,
      semesters: new Map<number, RatingAccumulator>(),
    }
    const semesterRating =
      facultySemester.semesters.get(row.semesterNumber) ?? createAccumulator()
    addRating(semesterRating, row)
    facultySemester.semesters.set(row.semesterNumber, semesterRating)
    facultySemesterMap.set(row.facultyId, facultySemester)

    const perSubject = subjectFacultyMap.get(row.subjectId) ?? new Map()
    const subjectFaculty = getOrCreateNamed(
      perSubject,
      row.facultyId,
      row.facultyAbbreviation || row.facultyName,
      row.facultyName
    )
    addRating(subjectFaculty, row)
    subjectFacultyMap.set(row.subjectId, perSubject)

    const rawBatch = normalizedText(row.batch)
    const batch =
      !rawBatch || rawBatch.toLowerCase() === "none" || rawBatch === "-"
        ? "All students"
        : rawBatch
    const batchAggregate = getOrCreateNamed(
      batchMap,
      `${row.divisionId}:${batch}`,
      batch === "All students" ? "All students" : `Batch ${batch}`,
      `${row.departmentAbbreviation} · Sem ${row.semesterNumber} · ${row.divisionName}`
    )
    addRating(batchAggregate, row)

    const category = getOrCreateNamed(
      categoryMap,
      normalizedText(row.questionCategoryName) || "Uncategorised feedback",
      normalizedText(row.questionCategoryName) || "Uncategorised feedback",
      "Question category"
    )
    addRating(category, row)

    addComparison(
      departmentYears,
      row.departmentName,
      row.academicYearString,
      row
    )
    addComparison(
      semesterYears,
      `Semester ${row.semesterNumber}`,
      row.academicYearString,
      row
    )
    addComparison(
      divisionYears,
      `${row.departmentAbbreviation} · Sem ${row.semesterNumber} · ${row.divisionName}`,
      row.academicYearString,
      row
    )
  }

  const subjects: SubjectRating[] = [...subjectMap.values()]
    .filter((subject) => subject.responses > 0)
    .map((subject) => ({
      id: subject.id,
      label: subject.label,
      detail: subject.detail,
      lecture:
        subject.lectureResponses > 0
          ? Number((subject.lectureTotal / subject.lectureResponses).toFixed(2))
          : null,
      lab:
        subject.labResponses > 0
          ? Number((subject.labTotal / subject.labResponses).toFixed(2))
          : null,
      overall: Number((subject.total / subject.responses).toFixed(2)),
      responses: subject.responses,
      students: subject.students.size,
      faculties: subject.faculties.size,
    }))
    .sort((first, second) => second.overall - first.overall)

  const faculty: FacultyRating[] = [...facultyMap.values()]
    .filter((entry) => entry.responses > 0)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      detail: entry.detail,
      average: Number((entry.total / entry.responses).toFixed(2)),
      responses: entry.responses,
      students: entry.students.size,
      subjects: entry.subjects.size,
      divisions: entry.divisions.size,
    }))
    .sort((first, second) => second.average - first.average)

  const facultyById = new Map(faculty.map((entry) => [entry.id, entry]))
  const facultySemesters: FacultySemesterRating[] = [
    ...facultySemesterMap.values(),
  ]
    .map((entry) => {
      const overall = facultyById.get(entry.id)
      const semesters: Record<number, number> = {}
      const semesterResponses: Record<number, number> = {}
      for (const [semesterNumber, rating] of entry.semesters) {
        semesters[semesterNumber] = Number(
          (rating.total / rating.responses).toFixed(2)
        )
        semesterResponses[semesterNumber] = rating.responses
      }
      return {
        ...(overall ?? {
          id: entry.id,
          label: entry.label,
          detail: entry.detail,
          average: 0,
          responses: 0,
          students: 0,
          subjects: 0,
          divisions: 0,
        }),
        semesters,
        semesterResponses,
      }
    })
    .sort((first, second) => first.detail.localeCompare(second.detail))

  const subjectFaculty: SubjectFacultyRating[] = subjects.map((subject) => ({
    id: subject.id,
    label: subject.label,
    detail: subject.detail,
    overall: subject.overall,
    responses: subject.responses,
    faculty: [...(subjectFacultyMap.get(subject.id)?.values() ?? [])]
      .filter((entry) => entry.responses > 0)
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        detail: entry.detail,
        average: Number((entry.total / entry.responses).toFixed(2)),
        responses: entry.responses,
        students: entry.students.size,
        subjects: entry.subjects.size,
        divisions: entry.divisions.size,
      }))
      .sort((first, second) => second.average - first.average),
  }))

  const batches: BatchRating[] = [...batchMap.values()]
    .filter((entry) => entry.responses > 0)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      detail: entry.detail,
      average: Number((entry.total / entry.responses).toFixed(2)),
      responses: entry.responses,
      students: entry.students.size,
    }))
    .sort((first, second) => second.average - first.average)

  const categories: CategoryRating[] = [...categoryMap.values()]
    .filter((entry) => entry.responses > 0)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      average: Number((entry.total / entry.responses).toFixed(2)),
      responses: entry.responses,
      students: entry.students.size,
    }))
    .sort((first, second) => second.average - first.average)

  return {
    years,
    subjects,
    faculty,
    facultySemesters,
    subjectFaculty,
    departments: toComparisonRows(departmentYears, years),
    semesters: toComparisonRows(semesterYears, years),
    divisions: toComparisonRows(divisionYears, years),
    batches,
    categories,
  }
}

const getAnalyticsDictionary = unstable_cache(
  async () => {
    const [years, departments, semesters, divisions, subjects] =
      await Promise.all([
        prisma.academicYear.findMany({
          where: { isDeleted: false },
          orderBy: { yearString: "desc" },
          select: { id: true, yearString: true, isActive: true },
        }),
        prisma.department.findMany({
          where: { isDeleted: false },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.semester.findMany({
          where: { isDeleted: false },
          orderBy: [
            { academicYear: { yearString: "desc" } },
            { semesterNumber: "asc" },
          ],
          select: {
            id: true,
            departmentId: true,
            academicYearId: true,
            semesterNumber: true,
            semesterType: true,
            department: { select: { abbreviation: true } },
          },
        }),
        prisma.division.findMany({
          where: { isDeleted: false },
          orderBy: { divisionName: "asc" },
          select: {
            id: true,
            departmentId: true,
            semesterId: true,
            divisionName: true,
            department: { select: { abbreviation: true } },
            semester: { select: { semesterNumber: true } },
          },
        }),
        prisma.subject.findMany({
          where: { isDeleted: false },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            subjectCode: true,
            departmentId: true,
            semesterId: true,
          },
        }),
      ])
    return { years, departments, semesters, divisions, subjects }
  },
  ["analytics-filter-dictionary"],
  { revalidate: 300, tags: ["analytics"] }
)

type FormCompletion = {
  submitted: number
  invited: number
  activeForms: number
}

type FormCompletionRow = {
  submitted: number
  invited: number
  active_forms: number
}

type SemesterParticipationAggregateRow = {
  group_academic_year: number
  group_department: number
  group_semester: number
  group_subject: number
  group_division: number
  group_teaching: number
  academic_year_string: string | null
  department_abbreviation: string | null
  semester_number: number | null
  subject_label: string | null
  subject_name: string | null
  division_name: string | null
  is_lab: boolean | null
  students: number
  responses: number
  average: number | null
}

const getFormCompletion = unstable_cache(
  async (
    academicYearId: string,
    departmentId: string,
    semesterId: string,
    divisionId: string,
    subjectId: string,
    teaching: "all" | "lecture" | "lab"
  ): Promise<FormCompletion> => {
    const conditions = [
      Prisma.sql`feedback_form.is_deleted = false`,
      Prisma.sql`division.is_deleted = false`,
      Prisma.sql`semester.is_deleted = false`,
      Prisma.sql`allocation.is_deleted = false`,
    ]
    if (academicYearId)
      conditions.push(Prisma.sql`semester.academic_year_id = ${academicYearId}`)
    if (departmentId)
      conditions.push(Prisma.sql`division.department_id = ${departmentId}`)
    if (semesterId)
      conditions.push(Prisma.sql`division.semester_id = ${semesterId}`)
    if (divisionId)
      conditions.push(Prisma.sql`feedback_form.division_id = ${divisionId}`)
    if (subjectId)
      conditions.push(Prisma.sql`allocation.subject_id = ${subjectId}`)
    if (teaching !== "all") {
      conditions.push(
        Prisma.sql`allocation.lecture_type = ${
          teaching === "lab" ? "LAB" : "LECTURE"
        }`
      )
    }

    const [result] = await prisma.$queryRaw<FormCompletionRow[]>(Prisma.sql`
      SELECT
        COUNT(access.id) FILTER (
          WHERE access.is_deleted = false
            AND (feedback_form.status = 'ACTIVE' OR feedback_form.activated_at IS NOT NULL)
            AND access.is_submitted = true
        )::int AS submitted,
        COUNT(access.id) FILTER (
          WHERE access.is_deleted = false
            AND (feedback_form.status = 'ACTIVE' OR feedback_form.activated_at IS NOT NULL)
        )::int AS invited,
        COUNT(DISTINCT feedback_form.id) FILTER (WHERE feedback_form.status = 'ACTIVE')::int AS active_forms
      FROM feedback_forms AS feedback_form
      INNER JOIN divisions AS division ON division.id = feedback_form.division_id
      INNER JOIN semesters AS semester ON semester.id = division.semester_id
      INNER JOIN subject_allocations AS allocation ON allocation.id = feedback_form.subject_allocation_id
      LEFT JOIN form_access AS access ON access.form_id = feedback_form.id
      WHERE ${Prisma.join(conditions, " AND ")}
    `)
    return {
      submitted: numericValue(result?.submitted),
      invited: numericValue(result?.invited),
      activeForms: numericValue(result?.active_forms),
    }
  },
  ["analytics-form-completion"],
  { revalidate: 300, tags: ["analytics"] }
)

const getSemesterParticipation = unstable_cache(
  async (
    academicYearId: string,
    departmentId: string,
    semesterId: string,
    divisionId: string,
    subjectId: string,
    teaching: "all" | "lecture" | "lab"
  ): Promise<SemesterParticipation[]> => {
    const conditions = [
      Prisma.sql`is_deleted = false`,
      Prisma.sql`academic_year_is_deleted = false`,
      Prisma.sql`department_is_deleted = false`,
      Prisma.sql`semester_is_deleted = false`,
      Prisma.sql`division_is_deleted = false`,
      Prisma.sql`subject_is_deleted = false`,
      Prisma.sql`form_is_deleted = false`,
      Prisma.sql`question_is_deleted = false`,
      Prisma.sql`numeric_rating IS NOT NULL`,
    ]
    if (academicYearId)
      conditions.push(Prisma.sql`academic_year_id = ${academicYearId}`)
    if (departmentId)
      conditions.push(Prisma.sql`department_id = ${departmentId}`)
    if (semesterId) conditions.push(Prisma.sql`semester_id = ${semesterId}`)
    if (divisionId) conditions.push(Prisma.sql`division_id = ${divisionId}`)
    if (subjectId) conditions.push(Prisma.sql`subject_id = ${subjectId}`)

    const teachingCondition =
      teaching === "all"
        ? Prisma.sql`true`
        : teaching === "lab"
          ? Prisma.sql`is_lab = true`
          : Prisma.sql`is_lab = false`
    const rows = await prisma.$queryRaw<SemesterParticipationAggregateRow[]>(
      Prisma.sql`
        WITH filtered AS (
          SELECT
            academic_year_string,
            department_abbreviation,
            semester_number,
            division_name,
            subject_id,
            COALESCE(NULLIF(subject_abbreviation, ''), subject_code) AS subject_label,
            subject_name,
            COALESCE(student_id::text, student_enrollment_number) AS student_key,
            numeric_rating::double precision AS rating,
            CASE
              WHEN lower(btrim(COALESCE(question_category_name, ''))) LIKE '%lab%'
                OR lower(btrim(COALESCE(question_category_name, ''))) LIKE '%laboratory%'
                OR (
                  btrim(COALESCE(question_batch, '')) <> ''
                  AND lower(btrim(question_batch)) NOT IN ('none', '-')
                )
              THEN true
              ELSE false
            END AS is_lab
          FROM feedback_snapshots
          WHERE ${Prisma.join(conditions, " AND ")}
        ),
        scoped AS MATERIALIZED (
          SELECT * FROM filtered WHERE ${teachingCondition}
        )
        SELECT
          GROUPING(academic_year_string)::int AS group_academic_year,
          GROUPING(department_abbreviation)::int AS group_department,
          GROUPING(semester_number)::int AS group_semester,
          GROUPING(subject_id)::int AS group_subject,
          GROUPING(division_name)::int AS group_division,
          GROUPING(is_lab)::int AS group_teaching,
          academic_year_string,
          department_abbreviation,
          semester_number,
          subject_label,
          subject_name,
          division_name,
          is_lab,
          COUNT(DISTINCT student_key)::int AS students,
          COUNT(*)::int AS responses,
          ROUND(AVG(rating)::numeric, 2)::double precision AS average
        FROM scoped
        GROUP BY GROUPING SETS (
          (academic_year_string, department_abbreviation, semester_number),
          (academic_year_string, department_abbreviation, semester_number, subject_id, subject_label, subject_name, is_lab),
          (academic_year_string, department_abbreviation, semester_number, division_name)
        )
      `
    )

    const report = new Map<string, SemesterParticipation>()
    const keyFor = (row: SemesterParticipationAggregateRow) =>
      `${row.academic_year_string ?? ""}:${row.department_abbreviation ?? ""}:${row.semester_number ?? ""}`

    for (const row of rows) {
      if (
        !row.academic_year_string ||
        !row.department_abbreviation ||
        !row.semester_number
      )
        continue
      const key = keyFor(row)
      const entry = report.get(key) ?? {
        academicYear: row.academic_year_string,
        department: row.department_abbreviation,
        semesterNumber: row.semester_number,
        students: 0,
        responses: 0,
        average: 0,
        subjects: [],
        divisions: [],
      }
      const isOverall =
        row.group_subject === 1 &&
        row.group_division === 1 &&
        row.group_teaching === 1
      if (isOverall) {
        entry.students = numericValue(row.students)
        entry.responses = numericValue(row.responses)
        entry.average = numericValue(row.average)
      } else if (
        row.group_subject === 0 &&
        row.group_division === 1 &&
        row.group_teaching === 0
      ) {
        entry.subjects.push({
          label: row.subject_label ?? "Subject",
          detail: row.subject_name ?? row.subject_label ?? "Subject",
          teachingType: row.is_lab ? "Lab" : "Lecture",
          students: numericValue(row.students),
          responses: numericValue(row.responses),
          average: numericValue(row.average),
        })
      } else if (
        row.group_subject === 1 &&
        row.group_division === 0 &&
        row.group_teaching === 1
      ) {
        entry.divisions.push({
          label: row.division_name ?? "—",
          students: numericValue(row.students),
          responses: numericValue(row.responses),
          average: numericValue(row.average),
        })
      }
      report.set(key, entry)
    }

    return [...report.values()]
      .map((entry) => ({
        ...entry,
        subjects: entry.subjects.sort((first, second) =>
          `${first.detail} ${first.teachingType}`.localeCompare(
            `${second.detail} ${second.teachingType}`
          )
        ),
        divisions: entry.divisions.sort((first, second) =>
          first.label.localeCompare(second.label, undefined, { numeric: true })
        ),
      }))
      .sort(
        (first, second) =>
          first.academicYear.localeCompare(second.academicYear) ||
          first.department.localeCompare(second.department) ||
          first.semesterNumber - second.semesterNumber
      )
  },
  ["analytics-semester-participation"],
  { revalidate: 300, tags: ["analytics"] }
)

async function getAnalyticsRows(
  academicYearId: string,
  departmentId: string,
  semesterId: string,
  divisionId: string,
  subjectId: string
) {
  return prisma.feedbackSnapshot.findMany({
    where: {
      isDeleted: false,
      academicYearIsDeleted: false,
      departmentIsDeleted: false,
      semesterIsDeleted: false,
      divisionIsDeleted: false,
      subjectIsDeleted: false,
      formIsDeleted: false,
      questionIsDeleted: false,
      numericRating: { not: null },
      ...(academicYearId ? { academicYearId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(semesterId ? { semesterId } : {}),
      ...(divisionId ? { divisionId } : {}),
      ...(subjectId ? { subjectId } : {}),
    },
    select: snapshotSelect,
  })
}

type AnalyticsSummary = {
  workspaceData: AnalyticsWorkspaceData
  uniqueStudents: number
  uniqueSubjects: number
  uniqueFaculty: number
  totalResponses: number
  overallRating: number | null
  distribution: { score: string; responses: number }[]
}

type AnalyticsSummaryRow = { payload: AnalyticsSummary }

type AnalyticsAggregateRow = {
  group_subject: number
  group_faculty: number
  group_division: number
  group_batch: number
  group_category: number
  group_department: number
  group_semester: number
  group_year: number
  group_rating: number
  subject_id: string | null
  subject_label: string | null
  subject_name: string | null
  faculty_id: string | null
  faculty_label: string | null
  faculty_name: string | null
  division_id: string | null
  batch_key: string | null
  batch_label: string | null
  department_abbreviation: string | null
  semester_number: number | null
  division_name: string | null
  category_label: string | null
  department_name: string | null
  academic_year_string: string | null
  rating: number | null
  overall: number | null
  lecture: number | null
  lab: number | null
  responses: number
  students: number
  subjects: number
  faculties: number
  divisions: number
}

function numericValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function isAggregateRow(
  row: AnalyticsAggregateRow,
  expected: Partial<
    Pick<
      AnalyticsAggregateRow,
      | "group_subject"
      | "group_faculty"
      | "group_division"
      | "group_batch"
      | "group_category"
      | "group_department"
      | "group_semester"
      | "group_year"
      | "group_rating"
    >
  >
) {
  return Object.entries(expected).every(
    ([key, value]) => row[key as keyof typeof expected] === value
  )
}

function comparisonRows(
  entries: Map<string, Map<string, { average: number; responses: number }>>
) {
  return [...entries.entries()]
    .map(([label, values]) => ({
      label,
      values: Object.fromEntries(
        [...values.entries()].map(([year, value]) => [year, value.average])
      ),
      responses: Object.fromEntries(
        [...values.entries()].map(([year, value]) => [year, value.responses])
      ),
    }))
    .sort((first, second) => first.label.localeCompare(second.label))
}

async function getAnalyticsSummaryFromGroupedDatabase(
  academicYearId: string,
  departmentId: string,
  semesterId: string,
  divisionId: string,
  subjectId: string,
  teaching: "all" | "lecture" | "lab"
): Promise<AnalyticsSummary> {
  const conditions = [
    Prisma.sql`is_deleted = false`,
    Prisma.sql`academic_year_is_deleted = false`,
    Prisma.sql`department_is_deleted = false`,
    Prisma.sql`semester_is_deleted = false`,
    Prisma.sql`division_is_deleted = false`,
    Prisma.sql`subject_is_deleted = false`,
    Prisma.sql`form_is_deleted = false`,
    Prisma.sql`question_is_deleted = false`,
    Prisma.sql`numeric_rating IS NOT NULL`,
  ]

  if (academicYearId)
    conditions.push(Prisma.sql`academic_year_id = ${academicYearId}`)
  if (departmentId) conditions.push(Prisma.sql`department_id = ${departmentId}`)
  if (semesterId) conditions.push(Prisma.sql`semester_id = ${semesterId}`)
  if (divisionId) conditions.push(Prisma.sql`division_id = ${divisionId}`)
  if (subjectId) conditions.push(Prisma.sql`subject_id = ${subjectId}`)

  const teachingCondition =
    teaching === "all"
      ? Prisma.sql`true`
      : teaching === "lab"
        ? Prisma.sql`is_lab = true`
        : Prisma.sql`is_lab = false`
  const rows = await prisma.$transaction(async (transaction) => {
    // The report uses several DISTINCT aggregates. Eight megabytes prevents the
    // working set from spilling to disk without changing Neon globally.
    await transaction.$executeRaw`SET LOCAL work_mem TO 8192`
    return transaction.$queryRaw<AnalyticsAggregateRow[]>(Prisma.sql`
    WITH filtered AS (
      SELECT
        academic_year_string,
        department_name,
        department_abbreviation,
        semester_number,
        division_id,
        division_name,
        subject_id,
        COALESCE(NULLIF(subject_abbreviation, ''), subject_code) AS subject_label,
        subject_name,
        faculty_id,
        COALESCE(NULLIF(faculty_abbreviation, ''), faculty_name) AS faculty_label,
        faculty_name,
        COALESCE(NULLIF(btrim(question_category_name), ''), 'Uncategorised feedback') AS category_label,
        CASE
          WHEN btrim(COALESCE(batch, '')) = '' OR lower(btrim(batch)) IN ('none', '-') THEN 'all'
          ELSE btrim(batch)
        END AS batch_key,
        CASE
          WHEN btrim(COALESCE(batch, '')) = '' OR lower(btrim(batch)) IN ('none', '-') THEN 'All students'
          ELSE 'Batch ' || btrim(batch)
        END AS batch_label,
        COALESCE(student_id::text, student_enrollment_number) AS student_key,
        numeric_rating::double precision AS rating,
        CASE
          WHEN lower(btrim(COALESCE(question_category_name, ''))) LIKE '%lab%'
            OR lower(btrim(COALESCE(question_category_name, ''))) LIKE '%laboratory%'
            OR (
              btrim(COALESCE(question_batch, '')) <> ''
              AND lower(btrim(question_batch)) NOT IN ('none', '-')
            )
          THEN true
          ELSE false
        END AS is_lab
      FROM feedback_snapshots
      WHERE ${Prisma.join(conditions, " AND ")}
    ),
    scoped AS MATERIALIZED (
      SELECT * FROM filtered WHERE ${teachingCondition}
    )
    SELECT
      GROUPING(subject_id)::int AS group_subject,
      GROUPING(faculty_id)::int AS group_faculty,
      GROUPING(division_id)::int AS group_division,
      GROUPING(batch_key)::int AS group_batch,
      GROUPING(category_label)::int AS group_category,
      GROUPING(department_name)::int AS group_department,
      GROUPING(semester_number)::int AS group_semester,
      GROUPING(academic_year_string)::int AS group_year,
      GROUPING(rating)::int AS group_rating,
      subject_id,
      subject_label,
      subject_name,
      faculty_id,
      faculty_label,
      faculty_name,
      division_id,
      batch_key,
      batch_label,
      department_abbreviation,
      semester_number,
      division_name,
      category_label,
      department_name,
      academic_year_string,
      rating,
      ROUND(AVG(rating)::numeric, 2)::double precision AS overall,
      ROUND((AVG(rating) FILTER (WHERE NOT is_lab))::numeric, 2)::double precision AS lecture,
      ROUND((AVG(rating) FILTER (WHERE is_lab))::numeric, 2)::double precision AS lab,
      COUNT(*)::int AS responses,
      COUNT(DISTINCT student_key)::int AS students,
      COUNT(DISTINCT subject_id)::int AS subjects,
      COUNT(DISTINCT faculty_id)::int AS faculties,
      COUNT(DISTINCT division_id)::int AS divisions
    FROM scoped
    GROUP BY GROUPING SETS (
      (),
      (rating),
      (academic_year_string),
      (subject_id, subject_label, subject_name),
      (faculty_id, faculty_label, faculty_name),
      (faculty_id, faculty_label, faculty_name, semester_number),
      (subject_id, subject_label, subject_name, faculty_id, faculty_label, faculty_name),
      (division_id, batch_key, batch_label, department_abbreviation, semester_number, division_name),
      (category_label),
      (department_name, academic_year_string),
      (semester_number, academic_year_string),
      (division_id, department_abbreviation, semester_number, division_name, academic_year_string)
    )
    `)
  })

  const distribution = Array.from({ length: 10 }, (_, index) => ({
    score: String(index + 1),
    responses: 0,
  }))
  const years = new Set<string>()
  const subjects = new Map<string, SubjectRating>()
  const faculty = new Map<string, FacultyRating>()
  const facultySemesters = new Map<string, FacultySemesterRating>()
  const subjectFaculty = new Map<string, FacultyRating[]>()
  const batches: BatchRating[] = []
  const categories: CategoryRating[] = []
  const departments = new Map<
    string,
    Map<string, { average: number; responses: number }>
  >()
  const semesters = new Map<
    string,
    Map<string, { average: number; responses: number }>
  >()
  const divisions = new Map<
    string,
    Map<string, { average: number; responses: number }>
  >()
  let metrics = {
    uniqueStudents: 0,
    uniqueSubjects: 0,
    uniqueFaculty: 0,
    totalResponses: 0,
    overallRating: null as number | null,
  }

  for (const row of rows) {
    if (
      isAggregateRow(row, {
        group_subject: 1,
        group_faculty: 1,
        group_division: 1,
        group_batch: 1,
        group_category: 1,
        group_department: 1,
        group_semester: 1,
        group_year: 1,
        group_rating: 1,
      })
    ) {
      metrics = {
        uniqueStudents: numericValue(row.students),
        uniqueSubjects: numericValue(row.subjects),
        uniqueFaculty: numericValue(row.faculties),
        totalResponses: numericValue(row.responses),
        overallRating: row.overall === null ? null : numericValue(row.overall),
      }
      continue
    }
    if (isAggregateRow(row, { group_rating: 0, group_year: 1 })) {
      const score = numericValue(row.rating)
      if (score >= 1 && score <= 10 && Number.isInteger(score)) {
        distribution[score - 1]!.responses = numericValue(row.responses)
      }
      continue
    }
    if (
      isAggregateRow(row, {
        group_year: 0,
        group_subject: 1,
        group_faculty: 1,
        group_division: 1,
        group_batch: 1,
        group_category: 1,
        group_department: 1,
        group_semester: 1,
        group_rating: 1,
      }) &&
      row.academic_year_string
    ) {
      years.add(row.academic_year_string)
      continue
    }
    if (
      isAggregateRow(row, {
        group_subject: 0,
        group_faculty: 1,
        group_year: 1,
      }) &&
      row.subject_id
    ) {
      subjects.set(row.subject_id, {
        id: row.subject_id,
        label: row.subject_label ?? "Subject",
        detail: row.subject_name ?? "",
        lecture: row.lecture === null ? null : numericValue(row.lecture),
        lab: row.lab === null ? null : numericValue(row.lab),
        overall: numericValue(row.overall),
        responses: numericValue(row.responses),
        students: numericValue(row.students),
        faculties: numericValue(row.faculties),
      })
      continue
    }
    if (
      isAggregateRow(row, {
        group_subject: 1,
        group_faculty: 0,
        group_semester: 0,
        group_year: 1,
      }) &&
      row.faculty_id &&
      row.semester_number
    ) {
      const existing = facultySemesters.get(row.faculty_id) ?? {
        id: row.faculty_id,
        label: row.faculty_label ?? "Faculty",
        detail: row.faculty_name ?? "",
        average: 0,
        responses: 0,
        students: 0,
        subjects: 0,
        divisions: 0,
        semesters: {},
        semesterResponses: {},
      }
      existing.semesters[row.semester_number] = numericValue(row.overall)
      existing.semesterResponses[row.semester_number] = numericValue(
        row.responses
      )
      facultySemesters.set(row.faculty_id, existing)
      continue
    }
    if (
      isAggregateRow(row, {
        group_subject: 1,
        group_faculty: 0,
        group_semester: 1,
        group_year: 1,
      }) &&
      row.faculty_id
    ) {
      faculty.set(row.faculty_id, {
        id: row.faculty_id,
        label: row.faculty_label ?? "Faculty",
        detail: row.faculty_name ?? "",
        average: numericValue(row.overall),
        responses: numericValue(row.responses),
        students: numericValue(row.students),
        subjects: numericValue(row.subjects),
        divisions: numericValue(row.divisions),
      })
      continue
    }
    if (
      isAggregateRow(row, {
        group_subject: 0,
        group_faculty: 0,
        group_year: 1,
      }) &&
      row.subject_id &&
      row.faculty_id
    ) {
      const values = subjectFaculty.get(row.subject_id) ?? []
      values.push({
        id: row.faculty_id,
        label: row.faculty_label ?? "Faculty",
        detail: row.faculty_name ?? "",
        average: numericValue(row.overall),
        responses: numericValue(row.responses),
        students: numericValue(row.students),
        subjects: numericValue(row.subjects),
        divisions: numericValue(row.divisions),
      })
      subjectFaculty.set(row.subject_id, values)
      continue
    }
    if (
      isAggregateRow(row, {
        group_division: 0,
        group_batch: 0,
        group_year: 1,
      }) &&
      row.division_id &&
      row.batch_key
    ) {
      batches.push({
        id: `${row.division_id}:${row.batch_key}`,
        label: row.batch_label ?? "All students",
        detail: `${row.department_abbreviation ?? ""} · Sem ${row.semester_number ?? ""} · ${row.division_name ?? ""}`,
        average: numericValue(row.overall),
        responses: numericValue(row.responses),
        students: numericValue(row.students),
      })
      continue
    }
    if (
      isAggregateRow(row, { group_category: 0, group_year: 1 }) &&
      row.category_label
    ) {
      categories.push({
        id: row.category_label,
        label: row.category_label,
        average: numericValue(row.overall),
        responses: numericValue(row.responses),
        students: numericValue(row.students),
      })
      continue
    }

    const comparisonTargets = [
      {
        target: departments,
        matches: isAggregateRow(row, {
          group_department: 0,
          group_year: 0,
          group_semester: 1,
          group_division: 1,
        }),
        label: row.department_name,
      },
      {
        target: semesters,
        matches: isAggregateRow(row, {
          group_department: 1,
          group_semester: 0,
          group_year: 0,
          group_division: 1,
        }),
        label: row.semester_number ? `Semester ${row.semester_number}` : null,
      },
      {
        target: divisions,
        matches: isAggregateRow(row, {
          group_department: 1,
          group_semester: 0,
          group_division: 0,
          group_year: 0,
        }),
        label:
          row.division_name && row.semester_number
            ? `${row.department_abbreviation ?? ""} · Sem ${row.semester_number} · ${row.division_name}`
            : null,
      },
    ]
    for (const comparison of comparisonTargets) {
      if (!comparison.matches || !comparison.label || !row.academic_year_string)
        continue
      const byYear = comparison.target.get(comparison.label) ?? new Map()
      byYear.set(row.academic_year_string, {
        average: numericValue(row.overall),
        responses: numericValue(row.responses),
      })
      comparison.target.set(comparison.label, byYear)
    }
  }

  const subjectRows = [...subjects.values()].sort(
    (first, second) => second.overall - first.overall
  )
  return {
    ...metrics,
    distribution,
    workspaceData: {
      years: [...years].sort(),
      subjects: subjectRows,
      faculty: [...faculty.values()].sort(
        (first, second) => second.average - first.average
      ),
      facultySemesters: [...facultySemesters.values()]
        .map((entry) => {
          const overall = faculty.get(entry.id)
          return overall
            ? {
                ...overall,
                semesters: entry.semesters,
                semesterResponses: entry.semesterResponses,
              }
            : entry
        })
        .sort((first, second) => first.detail.localeCompare(second.detail)),
      subjectFaculty: subjectRows.map((subject) => ({
        id: subject.id,
        label: subject.label,
        detail: subject.detail,
        overall: subject.overall,
        responses: subject.responses,
        faculty: (subjectFaculty.get(subject.id) ?? []).sort(
          (first, second) => second.average - first.average
        ),
      })),
      departments: comparisonRows(departments),
      semesters: comparisonRows(semesters),
      divisions: comparisonRows(divisions),
      batches: batches.sort((first, second) => second.average - first.average),
      categories: categories.sort(
        (first, second) => second.average - first.average
      ),
    },
  }
}

async function getAnalyticsSummaryFromDatabase(
  academicYearId: string,
  departmentId: string,
  semesterId: string,
  divisionId: string,
  subjectId: string,
  teaching: "all" | "lecture" | "lab"
): Promise<AnalyticsSummary> {
  if (process.env.ANALYTICS_JSON_QUERY !== "true") {
    return getAnalyticsSummaryFromGroupedDatabase(
      academicYearId,
      departmentId,
      semesterId,
      divisionId,
      subjectId,
      teaching
    )
  }

  const conditions = [
    Prisma.sql`is_deleted = false`,
    Prisma.sql`academic_year_is_deleted = false`,
    Prisma.sql`department_is_deleted = false`,
    Prisma.sql`semester_is_deleted = false`,
    Prisma.sql`division_is_deleted = false`,
    Prisma.sql`subject_is_deleted = false`,
    Prisma.sql`form_is_deleted = false`,
    Prisma.sql`question_is_deleted = false`,
    Prisma.sql`numeric_rating IS NOT NULL`,
  ]

  if (academicYearId)
    conditions.push(Prisma.sql`academic_year_id = ${academicYearId}`)
  if (departmentId) conditions.push(Prisma.sql`department_id = ${departmentId}`)
  if (semesterId) conditions.push(Prisma.sql`semester_id = ${semesterId}`)
  if (divisionId) conditions.push(Prisma.sql`division_id = ${divisionId}`)
  if (subjectId) conditions.push(Prisma.sql`subject_id = ${subjectId}`)

  const teachingCondition =
    teaching === "all"
      ? Prisma.sql`true`
      : teaching === "lab"
        ? Prisma.sql`is_lab = true`
        : Prisma.sql`is_lab = false`
  const [result] = await prisma.$queryRaw<AnalyticsSummaryRow[]>(Prisma.sql`
    WITH filtered AS (
      SELECT
        academic_year_string,
        department_name,
        department_abbreviation,
        semester_number,
        division_id,
        division_name,
        subject_id,
        subject_name,
        subject_abbreviation,
        subject_code,
        faculty_id,
        faculty_name,
        faculty_abbreviation,
        COALESCE(student_id::text, student_enrollment_number) AS student_key,
        question_category_name,
        batch,
        numeric_rating::double precision AS rating,
        CASE
          WHEN lower(btrim(COALESCE(question_category_name, ''))) LIKE '%lab%'
            OR lower(btrim(COALESCE(question_category_name, ''))) LIKE '%laboratory%'
            OR (
              btrim(COALESCE(question_batch, '')) <> ''
              AND lower(btrim(question_batch)) NOT IN ('none', '-')
            )
          THEN true
          ELSE false
        END AS is_lab
      FROM feedback_snapshots
      WHERE ${Prisma.join(conditions, " AND ")}
    ),
    scoped AS (
      SELECT * FROM filtered WHERE ${teachingCondition}
    ),
    overview AS (
      SELECT
        COUNT(*)::int AS total_responses,
        COUNT(DISTINCT student_key)::int AS unique_students,
        COUNT(DISTINCT subject_id)::int AS unique_subjects,
        COUNT(DISTINCT faculty_id)::int AS unique_faculty,
        ROUND(AVG(rating)::numeric, 2)::double precision AS overall_rating
      FROM scoped
    ),
    distribution AS (
      SELECT
        score::text AS score,
        COUNT(scoped.rating)::int AS responses
      FROM generate_series(1, 10) AS score
      LEFT JOIN scoped ON scoped.rating = score
      GROUP BY score
    ),
    subject_stats AS (
      SELECT
        subject_id AS id,
        COALESCE(NULLIF(subject_abbreviation, ''), subject_code) AS label,
        subject_name AS detail,
        ROUND((AVG(rating) FILTER (WHERE NOT is_lab))::numeric, 2)::double precision AS lecture,
        ROUND((AVG(rating) FILTER (WHERE is_lab))::numeric, 2)::double precision AS lab,
        ROUND(AVG(rating)::numeric, 2)::double precision AS overall,
        COUNT(*)::int AS responses,
        COUNT(DISTINCT student_key)::int AS students,
        COUNT(DISTINCT faculty_id)::int AS faculties
      FROM scoped
      GROUP BY subject_id, subject_abbreviation, subject_code, subject_name
    ),
    faculty_stats AS (
      SELECT
        faculty_id AS id,
        COALESCE(NULLIF(faculty_abbreviation, ''), faculty_name) AS label,
        faculty_name AS detail,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS responses,
        COUNT(DISTINCT student_key)::int AS students,
        COUNT(DISTINCT subject_id)::int AS subjects,
        COUNT(DISTINCT division_id)::int AS divisions
      FROM scoped
      GROUP BY faculty_id, faculty_abbreviation, faculty_name
    ),
    faculty_semester_stats AS (
      SELECT
        faculty_id,
        semester_number,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS responses
      FROM scoped
      GROUP BY faculty_id, semester_number
    ),
    faculty_semesters AS (
      SELECT
        faculty_id,
        jsonb_object_agg(semester_number::text, average) AS semesters,
        jsonb_object_agg(semester_number::text, responses) AS semester_responses
      FROM faculty_semester_stats
      GROUP BY faculty_id
    ),
    subject_faculty_stats AS (
      SELECT
        subject_id,
        faculty_id AS id,
        COALESCE(NULLIF(faculty_abbreviation, ''), faculty_name) AS label,
        faculty_name AS detail,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS responses,
        COUNT(DISTINCT student_key)::int AS students,
        COUNT(DISTINCT subject_id)::int AS subjects,
        COUNT(DISTINCT division_id)::int AS divisions
      FROM scoped
      GROUP BY subject_id, faculty_id, faculty_abbreviation, faculty_name
    ),
    subject_faculty AS (
      SELECT
        subject_id,
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'label', label,
            'detail', detail,
            'average', average,
            'responses', responses,
            'students', students,
            'subjects', subjects,
            'divisions', divisions
          )
          ORDER BY average DESC, label ASC
        ) AS faculty
      FROM subject_faculty_stats
      GROUP BY subject_id
    ),
    batch_stats AS (
      SELECT
        division_id || ':' || CASE
          WHEN btrim(COALESCE(batch, '')) = '' OR lower(btrim(batch)) IN ('none', '-')
            THEN 'all'
          ELSE btrim(batch)
        END AS id,
        CASE
          WHEN btrim(COALESCE(batch, '')) = '' OR lower(btrim(batch)) IN ('none', '-')
            THEN 'All students'
          ELSE 'Batch ' || btrim(batch)
        END AS label,
        department_abbreviation || ' · Sem ' || semester_number || ' · ' || division_name AS detail,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS responses,
        COUNT(DISTINCT student_key)::int AS students
      FROM scoped
      GROUP BY division_id, batch, department_abbreviation, semester_number, division_name
    ),
    category_stats AS (
      SELECT
        COALESCE(NULLIF(btrim(question_category_name), ''), 'Uncategorised feedback') AS label,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS responses,
        COUNT(DISTINCT student_key)::int AS students
      FROM scoped
      GROUP BY COALESCE(NULLIF(btrim(question_category_name), ''), 'Uncategorised feedback')
    ),
    department_year_stats AS (
      SELECT
        department_name AS label,
        academic_year_string AS year,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS response_count
      FROM scoped
      GROUP BY department_name, academic_year_string
    ),
    semester_year_stats AS (
      SELECT
        'Semester ' || semester_number AS label,
        academic_year_string AS year,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS response_count
      FROM scoped
      GROUP BY semester_number, academic_year_string
    ),
    division_year_stats AS (
      SELECT
        department_abbreviation || ' · Sem ' || semester_number || ' · ' || division_name AS label,
        academic_year_string AS year,
        ROUND(AVG(rating)::numeric, 2)::double precision AS average,
        COUNT(*)::int AS response_count
      FROM scoped
      GROUP BY department_abbreviation, semester_number, division_name, academic_year_string
    ),
    years AS (
      SELECT DISTINCT academic_year_string FROM scoped
    )
    SELECT jsonb_build_object(
      'uniqueStudents', (SELECT unique_students FROM overview),
      'uniqueSubjects', (SELECT unique_subjects FROM overview),
      'uniqueFaculty', (SELECT unique_faculty FROM overview),
      'totalResponses', (SELECT total_responses FROM overview),
      'overallRating', (SELECT overall_rating FROM overview),
      'distribution', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('score', score, 'responses', responses) ORDER BY score::int) FROM distribution),
        '[]'::jsonb
      ),
      'workspaceData', jsonb_build_object(
        'years', COALESCE((SELECT jsonb_agg(academic_year_string ORDER BY academic_year_string) FROM years), '[]'::jsonb),
        'subjects', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'label', label, 'detail', detail, 'lecture', lecture, 'lab', lab,
            'overall', overall, 'responses', responses, 'students', students, 'faculties', faculties
          ) ORDER BY overall DESC, label ASC) FROM subject_stats),
          '[]'::jsonb
        ),
        'faculty', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'label', label, 'detail', detail, 'average', average, 'responses', responses,
            'students', students, 'subjects', subjects, 'divisions', divisions
          ) ORDER BY average DESC, label ASC) FROM faculty_stats),
          '[]'::jsonb
        ),
        'facultySemesters', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', faculty.id, 'label', faculty.label, 'detail', faculty.detail,
            'average', faculty.average, 'responses', faculty.responses,
            'students', faculty.students, 'subjects', faculty.subjects, 'divisions', faculty.divisions,
            'semesters', COALESCE(faculty_semesters.semesters, '{}'::jsonb),
            'semesterResponses', COALESCE(faculty_semesters.semester_responses, '{}'::jsonb)
          ) ORDER BY faculty.detail ASC)
          FROM faculty_stats AS faculty
          LEFT JOIN faculty_semesters ON faculty_semesters.faculty_id = faculty.id),
          '[]'::jsonb
        ),
        'subjectFaculty', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', subjects.id, 'label', subjects.label, 'detail', subjects.detail,
            'overall', subjects.overall, 'responses', subjects.responses,
            'faculty', COALESCE(subject_faculty.faculty, '[]'::jsonb)
          ) ORDER BY subjects.overall DESC, subjects.label ASC)
          FROM subject_stats AS subjects
          LEFT JOIN subject_faculty ON subject_faculty.subject_id = subjects.id),
          '[]'::jsonb
        ),
        'batches', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'label', label, 'detail', detail, 'average', average,
            'responses', responses, 'students', students
          ) ORDER BY average DESC, label ASC) FROM batch_stats),
          '[]'::jsonb
        ),
        'categories', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', label, 'label', label, 'average', average, 'responses', responses, 'students', students
          ) ORDER BY average DESC, label ASC) FROM category_stats),
          '[]'::jsonb
        ),
        'departments', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'label', label,
            'values', values,
            'responses', responses
          ) ORDER BY label ASC)
          FROM (
            SELECT label, jsonb_object_agg(year, average) AS values, jsonb_object_agg(year, response_count) AS responses
            FROM department_year_stats GROUP BY label
          ) AS comparisons),
          '[]'::jsonb
        ),
        'semesters', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'label', label,
            'values', values,
            'responses', responses
          ) ORDER BY label ASC)
          FROM (
            SELECT label, jsonb_object_agg(year, average) AS values, jsonb_object_agg(year, response_count) AS responses
            FROM semester_year_stats GROUP BY label
          ) AS comparisons),
          '[]'::jsonb
        ),
        'divisions', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'label', label,
            'values', values,
            'responses', responses
          ) ORDER BY label ASC)
          FROM (
            SELECT label, jsonb_object_agg(year, average) AS values, jsonb_object_agg(year, response_count) AS responses
            FROM division_year_stats GROUP BY label
          ) AS comparisons),
          '[]'::jsonb
        )
      )
    ) AS payload
  `)

  if (!result?.payload) {
    throw new Error("Analytics query returned no payload.")
  }

  return result.payload
}

const getAnalyticsSummary = unstable_cache(
  async (
    academicYearId: string,
    departmentId: string,
    semesterId: string,
    divisionId: string,
    subjectId: string,
    teaching: "all" | "lecture" | "lab"
  ) => {
    try {
      return await getAnalyticsSummaryFromDatabase(
        academicYearId,
        departmentId,
        semesterId,
        divisionId,
        subjectId,
        teaching
      )
    } catch (error) {
      // Preserve reporting availability if a PostgreSQL feature differs across environments.
      console.error(
        "Analytics aggregate query failed; using compatibility path.",
        error
      )
    }
    const rawRows = await getAnalyticsRows(
      academicYearId,
      departmentId,
      semesterId,
      divisionId,
      subjectId
    )
    const rows = rawRows.filter((row) =>
      teaching === "all"
        ? true
        : teaching === "lab"
          ? isLabRating(row)
          : !isLabRating(row)
    )
    const distribution = Array.from({ length: 10 }, (_, index) => ({
      score: String(index + 1),
      responses: 0,
    }))
    const total = rows.reduce((sum, row) => {
      const rating = Number(row.numericRating)
      if (rating >= 1 && rating <= 10 && Number.isInteger(rating)) {
        distribution[rating - 1]!.responses += 1
      }
      return sum + rating
    }, 0)
    return {
      workspaceData: buildWorkspaceData(rows),
      uniqueStudents: new Set(
        rows.map((row) => row.studentId ?? row.studentEnrollmentNumber)
      ).size,
      uniqueSubjects: new Set(rows.map((row) => row.subjectId)).size,
      uniqueFaculty: new Set(rows.map((row) => row.facultyId)).size,
      totalResponses: rows.length,
      overallRating: rows.length > 0 ? total / rows.length : null,
      distribution,
    }
  },
  ["analytics-summary-v2"],
  { revalidate: 300, tags: ["analytics"] }
)

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>
}) {
  const [rawSearchParams, dictionary] = await Promise.all([
    searchParams,
    getAnalyticsDictionary(),
  ])
  const { years, departments, semesters, divisions, subjects } = dictionary
  const activeYear = years.find((year) => year.isActive)
  const selectedYearId = readId(
    rawSearchParams.year === "all"
      ? undefined
      : (rawSearchParams.year ?? activeYear?.id),
    new Set(years.map((year) => year.id))
  )
  const selectedDepartmentId = readId(
    rawSearchParams.department,
    new Set(departments.map((department) => department.id))
  )
  const selectedSemesterId = readId(
    rawSearchParams.semester,
    new Set(semesters.map((semester) => semester.id))
  )
  const selectedDivisionId = readId(
    rawSearchParams.division,
    new Set(divisions.map((division) => division.id))
  )
  const selectedSubjectId = readId(
    rawSearchParams.subject,
    new Set(subjects.map((subject) => subject.id))
  )
  const selectedTeaching =
    rawSearchParams.teaching === "lecture" || rawSearchParams.teaching === "lab"
      ? rawSearchParams.teaching
      : "all"

  const [summary, completion, semesterParticipation] = await Promise.all([
    getAnalyticsSummary(
      selectedYearId ?? "",
      selectedDepartmentId ?? "",
      selectedSemesterId ?? "",
      selectedDivisionId ?? "",
      selectedSubjectId ?? "",
      selectedTeaching
    ),
    getFormCompletion(
      selectedYearId ?? "",
      selectedDepartmentId ?? "",
      selectedSemesterId ?? "",
      selectedDivisionId ?? "",
      selectedSubjectId ?? "",
      selectedTeaching
    ),
    getSemesterParticipation(
      selectedYearId ?? "",
      selectedDepartmentId ?? "",
      selectedSemesterId ?? "",
      selectedDivisionId ?? "",
      selectedSubjectId ?? "",
      selectedTeaching
    ),
  ])
  const { submitted, invited, activeForms } = completion
  const completionRate =
    invited > 0 ? Math.round((submitted / invited) * 100) : 0
  const selectedYear = years.find((year) => year.id === selectedYearId)

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Feedback intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Analytics
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">
            Complete feedback reporting across departments, semesters,
            divisions, subjects, batches, and faculty.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            {selectedYear ? selectedYear.yearString : "All academic years"}
          </Badge>
          <AnalyticsExport
            data={{
              workspaceData: summary.workspaceData,
              overallRating: summary.overallRating,
              totalResponses: summary.totalResponses,
              uniqueStudents: summary.uniqueStudents,
              uniqueSubjects: summary.uniqueSubjects,
              uniqueFaculty: summary.uniqueFaculty,
              semesterParticipation,
            }}
            selectedYear={selectedYear?.yearString}
          />
          <AnalyticsFilters
            years={years.map((year) => ({
              id: year.id,
              label: year.yearString,
            }))}
            departments={departments.map((department) => ({
              id: department.id,
              label: department.name,
            }))}
            semesters={semesters.map((semester) => ({
              id: semester.id,
              label: `${semester.department.abbreviation} · Semester ${semester.semesterNumber} · ${semester.semesterType.toLowerCase()}`,
              departmentId: semester.departmentId,
              academicYearId: semester.academicYearId,
            }))}
            divisions={divisions.map((division) => ({
              id: division.id,
              label: `${division.department.abbreviation} · Sem ${division.semester.semesterNumber} · ${division.divisionName}`,
              departmentId: division.departmentId,
              semesterId: division.semesterId,
            }))}
            subjects={subjects.map((subject) => ({
              id: subject.id,
              label: `${subject.subjectCode} · ${subject.name}`,
              departmentId: subject.departmentId,
              semesterId: subject.semesterId,
            }))}
            values={{
              year: selectedYearId,
              department: selectedDepartmentId,
              semester: selectedSemesterId,
              division: selectedDivisionId,
              subject: selectedSubjectId,
              teaching: selectedTeaching,
            }}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Students responded"
          value={summary.uniqueStudents.toLocaleString("en-IN")}
          detail="Unique students with submitted ratings"
          icon={GraduationCapIcon}
        />
        <MetricCard
          label="Total responses"
          value={summary.totalResponses.toLocaleString("en-IN")}
          detail="Individual numeric feedback responses"
          icon={ChartLineUpIcon}
        />
        <MetricCard
          label="Average rating"
          value={
            summary.overallRating
              ? `${summary.overallRating.toFixed(1)} / 10`
              : "—"
          }
          detail="Across the selected feedback scope"
          icon={StarIcon}
        />
        <MetricCard
          label="Unique subjects"
          value={summary.uniqueSubjects.toLocaleString("en-IN")}
          detail="Subjects receiving a rating"
          icon={BookOpenIcon}
        />
        <MetricCard
          label="Faculty count"
          value={summary.uniqueFaculty.toLocaleString("en-IN")}
          detail="Faculty members evaluated"
          icon={UsersThreeIcon}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <InsightCard
          title="Rating distribution"
          description="The spread of ratings from 1 to 10 for the current filter set."
        >
          <ResponseDistributionChart data={summary.distribution} />
        </InsightCard>
        <InsightCard
          title="Form completion"
          description={`${submitted.toLocaleString("en-IN")} of ${invited.toLocaleString("en-IN")} invited students completed an active or previously active form.`}
        >
          <CompletionChart submitted={submitted} invited={invited} />
          <p className="-mt-1 text-center text-xs text-muted-foreground">
            {activeForms} form{activeForms === 1 ? " is" : "s are"} currently
            active · {completionRate}% completed
          </p>
        </InsightCard>
      </section>

      <AnalyticsWorkspace data={summary.workspaceData} />
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>
}) {
  return (
    <Card>
      <CardContent className="">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" weight="fill" />
        </span>
        <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 text-sm font-medium">{label}</p>
        <p
          className="mt-0.5 truncate text-xs text-muted-foreground"
          title={detail}
        >
          {detail}
        </p>
      </CardContent>
    </Card>
  )
}

function InsightCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  )
}
