"use server"

import { randomBytes, randomUUID } from "node:crypto"
import ExcelJS from "exceljs"
import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { Prisma } from "@/generated/neon"
import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"
import { deliverFeedbackInvitations } from "@/lib/email"

export type FeedbackManagementState = {
  error?: string
  success?: string
  warning?: string
  fieldErrors?: Record<string, string[]>
  result?: { imported: number; skipped: number }
}

const formSchema = z
  .object({
    formId: z.string().uuid(),
    title: z.string().trim().min(3, "Enter a form title.").max(180),
    description: z.string().trim().max(1_000),
    status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid start date."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid closing date."),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "The closing date must be on or after the start date.",
    path: ["endDate"],
  })

const questionSchema = z.object({
  formId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  categoryId: z.string().trim().min(1, "Choose a category."),
  facultyId: z.string().uuid("Choose a faculty member."),
  subjectId: z.string().uuid("Choose a subject."),
  batch: z.string().trim().max(64),
  text: z
    .string()
    .trim()
    .min(8, "Enter a more descriptive question.")
    .max(1_000),
  type: z.enum(["rating", "text"]),
  isRequired: z.boolean(),
})

const studentRowSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  enrollmentNumber: z.string().trim().max(96),
  batch: z.string().trim().max(64),
  phoneNumber: z.string().trim().max(64),
})

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>
}

function revalidateFeedback() {
  updateTag("analytics")
  revalidatePath("/feedback-forms/[formId]", "page")
  revalidatePath("/feedback-forms")
  revalidatePath("/dashboard")
  revalidatePath("/analytics")
}

async function feedbackBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "")
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set APP_URL before sending production feedback invitations."
    )
  }

  const requestHeaders = await headers()
  const origin = requestHeaders.get("origin")
  if (origin) return origin.replace(/\/$/, "")
  const host = requestHeaders.get("host")
  if (host) return `http://${host}`

  throw new Error("Could not determine the feedback app URL.")
}

async function deliverFormInvitations(formId: string, baseUrl: string) {
  const form = await prisma.feedbackForm.findFirst({
    where: { id: formId, isDeleted: false, status: "ACTIVE" },
    select: {
      title: true,
      endDate: true,
      division: {
        select: {
          divisionName: true,
          department: { select: { name: true } },
          semester: { select: { semesterNumber: true } },
        },
      },
      formAccess: {
        where: { isDeleted: false, isSubmitted: false },
        select: {
          accessToken: true,
          student: { select: { name: true, email: true } },
          overrideStudent: { select: { name: true, email: true } },
        },
      },
    },
  })
  if (!form)
    throw new Error("This active feedback form is no longer available.")

  const invitations = form.formAccess.flatMap((access) => {
    const recipient = access.overrideStudent ?? access.student
    if (!recipient?.email) return []
    return [
      {
        to: recipient.email,
        recipientName: recipient.name,
        formTitle: form.title,
        departmentName: form.division.department.name,
        semesterNumber: form.division.semester.semesterNumber,
        divisionName: form.division.divisionName,
        closesOn: form.endDate,
        feedbackUrl: `${baseUrl}/feedback/${encodeURIComponent(access.accessToken)}`,
      },
    ]
  })

  return deliverFeedbackInvitations(invitations)
}

async function managedForm(formId: string) {
  const admin = await getCurrentAdmin()
  if (!admin?.isSuper)
    return { error: "Only Super Admins can manage feedback forms." as const }

  const form = await prisma.feedbackForm.findFirst({
    where: { id: formId, isDeleted: false },
    select: {
      id: true,
      status: true,
      activatedAt: true,
      division: {
        select: { departmentId: true, semesterId: true, divisionName: true },
      },
    },
  })
  if (!form)
    return { error: "This feedback form is no longer available." as const }

  return { admin, form }
}

function cellValue(value: ExcelJS.CellValue) {
  if (value && typeof value === "object" && "text" in value) {
    return String(value.text ?? "").trim()
  }
  return String(value ?? "").trim()
}

const studentColumnAliases = {
  name: ["name", "studentname"],
  email: ["email", "emailid", "emailaddress"],
  enrollmentNumber: [
    "enrollment",
    "enrollmentnumber",
    "enrollmentno",
    "enrolmentnumber",
  ],
  batch: ["batch"],
  phoneNumber: [
    "phone",
    "phonenumber",
    "contact",
    "contactnumber",
    "mobilenumber",
  ],
} as const

function normalizedHeader(value: ExcelJS.CellValue) {
  return cellValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

function findStudentUploadColumns(worksheet: ExcelJS.Worksheet) {
  for (
    let rowNumber = 1;
    rowNumber <= Math.min(worksheet.rowCount, 10);
    rowNumber += 1
  ) {
    const headerRow = worksheet.getRow(rowNumber)
    const columns = new Map<string, number>()
    for (let column = 1; column <= worksheet.columnCount; column += 1) {
      const value = normalizedHeader(headerRow.getCell(column).value)
      if (value) columns.set(value, column)
    }
    const findColumn = (aliases: readonly string[]) =>
      aliases.find((alias) => columns.has(alias))
    const nameAlias = findColumn(studentColumnAliases.name)
    const emailAlias = findColumn(studentColumnAliases.email)
    if (!nameAlias || !emailAlias) continue

    return {
      headerRow: rowNumber,
      name: columns.get(nameAlias)!,
      email: columns.get(emailAlias)!,
      enrollmentNumber: (() => {
        const alias = findColumn(studentColumnAliases.enrollmentNumber)
        return alias ? columns.get(alias) : undefined
      })(),
      batch: (() => {
        const alias = findColumn(studentColumnAliases.batch)
        return alias ? columns.get(alias) : undefined
      })(),
      phoneNumber: (() => {
        const alias = findColumn(studentColumnAliases.phoneNumber)
        return alias ? columns.get(alias) : undefined
      })(),
    }
  }
  return null
}

export async function updateFeedbackForm(
  _previousState: FeedbackManagementState,
  formData: FormData
): Promise<FeedbackManagementState> {
  const parsed = formSchema.safeParse({
    formId: formData.get("formId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const access = await managedForm(parsed.data.formId)
  if ("error" in access) return { error: access.error }

  if (parsed.data.status === "ACTIVE") {
    const [questionCount, recipientCount] = await Promise.all([
      prisma.feedbackQuestion.count({
        where: { formId: access.form.id, isDeleted: false },
      }),
      prisma.formAccess.count({
        where: { formId: access.form.id, isDeleted: false },
      }),
    ])
    if (questionCount === 0 || recipientCount === 0) {
      return {
        error:
          "Add at least one question and import the recipient list before activating this form.",
      }
    }
  }

  await prisma.feedbackForm.update({
    where: { id: access.form.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      activatedAt:
        parsed.data.status === "ACTIVE"
          ? (access.form.activatedAt ?? new Date())
          : access.form.activatedAt,
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T23:59:59.999Z`),
      isExpired: parsed.data.status === "CLOSED",
    },
  })

  revalidateFeedback()

  if (parsed.data.status === "ACTIVE" && access.form.status !== "ACTIVE") {
    try {
      const result = await deliverFormInvitations(
        access.form.id,
        await feedbackBaseUrl()
      )
      return {
        success: `Feedback form activated. ${result.sent} invitation${result.sent === 1 ? " was" : "s were"} sent.`,
        ...(result.failed > 0
          ? {
              warning: `${result.failed} invitation${result.failed === 1 ? " could" : "s could"} not be delivered.`,
            }
          : {}),
      }
    } catch (error) {
      return {
        success: "Feedback form activated.",
        warning:
          error instanceof Error
            ? `Invitations were not sent: ${error.message}`
            : "Invitations were not sent.",
      }
    }
  }

  return { success: "Feedback form details updated." }
}

export async function sendFeedbackInvitations(
  _previousState: FeedbackManagementState,
  formData: FormData
): Promise<FeedbackManagementState> {
  const formId = z.string().uuid().safeParse(formData.get("formId"))
  if (!formId.success)
    return { error: "This feedback form could not be identified." }

  const access = await managedForm(formId.data)
  if ("error" in access) return { error: access.error }
  if (access.form.status !== "ACTIVE") {
    return { error: "Activate the form before sending invitations." }
  }

  try {
    const result = await deliverFormInvitations(
      access.form.id,
      await feedbackBaseUrl()
    )
    revalidateFeedback()
    return {
      success: `${result.sent} invitation${result.sent === 1 ? " was" : "s were"} sent.`,
      ...(result.failed > 0
        ? {
            warning: `${result.failed} invitation${result.failed === 1 ? " could" : "s could"} not be delivered.`,
          }
        : {}),
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Could not send invitations: ${error.message}`
          : "Could not send invitations.",
    }
  }
}

async function validateQuestionContext(data: z.infer<typeof questionSchema>) {
  const access = await managedForm(data.formId)
  if ("error" in access) return access
  if (access.form.status !== "DRAFT") {
    return {
      error: "Questions can only be changed while a form is in draft." as const,
    }
  }

  const [category, faculty, subject] = await Promise.all([
    prisma.questionCategory.findFirst({
      where: { id: data.categoryId, isDeleted: false },
      select: { id: true },
    }),
    prisma.faculty.findFirst({
      where: {
        id: data.facultyId,
        departmentId: access.form.division.departmentId,
        isDeleted: false,
      },
      select: { id: true },
    }),
    prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        departmentId: access.form.division.departmentId,
        semesterId: access.form.division.semesterId,
        isDeleted: false,
      },
      select: { id: true },
    }),
  ])
  if (!category || !faculty || !subject) {
    return {
      error:
        "Choose a category, faculty member, and subject from this teaching group." as const,
    }
  }

  return access
}

function readQuestion(formData: FormData, includeQuestionId = false) {
  return questionSchema.safeParse({
    formId: formData.get("formId"),
    ...(includeQuestionId ? { questionId: formData.get("questionId") } : {}),
    categoryId: formData.get("categoryId"),
    facultyId: formData.get("facultyId"),
    subjectId: formData.get("subjectId"),
    batch: formData.get("batch") ?? "None",
    text: formData.get("text"),
    type: formData.get("type"),
    isRequired: formData.get("isRequired") === "on",
  })
}

export async function createFeedbackQuestion(
  _previousState: FeedbackManagementState,
  formData: FormData
): Promise<FeedbackManagementState> {
  const parsed = readQuestion(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const context = await validateQuestionContext(parsed.data)
  if ("error" in context) return { error: context.error }

  const latest = await prisma.feedbackQuestion.aggregate({
    where: { formId: context.form.id, isDeleted: false },
    _max: { displayOrder: true },
  })
  await prisma.feedbackQuestion.create({
    data: {
      formId: context.form.id,
      categoryId: parsed.data.categoryId,
      facultyId: parsed.data.facultyId,
      subjectId: parsed.data.subjectId,
      batch: parsed.data.batch || "None",
      text: parsed.data.text,
      type: parsed.data.type,
      isRequired: parsed.data.isRequired,
      displayOrder: (latest._max.displayOrder ?? 0) + 1,
    },
  })

  revalidateFeedback()
  return { success: "Question added to the draft." }
}

export async function updateFeedbackQuestion(
  _previousState: FeedbackManagementState,
  formData: FormData
): Promise<FeedbackManagementState> {
  const parsed = readQuestion(formData, true)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }
  if (!parsed.data.questionId) return { error: "Choose a question to update." }

  const context = await validateQuestionContext(parsed.data)
  if ("error" in context) return { error: context.error }

  const question = await prisma.feedbackQuestion.findFirst({
    where: {
      id: parsed.data.questionId,
      formId: context.form.id,
      isDeleted: false,
    },
    select: { id: true },
  })
  if (!question) return { error: "This question is no longer available." }

  await prisma.feedbackQuestion.update({
    where: { id: question.id },
    data: {
      categoryId: parsed.data.categoryId,
      facultyId: parsed.data.facultyId,
      subjectId: parsed.data.subjectId,
      batch: parsed.data.batch || "None",
      text: parsed.data.text,
      type: parsed.data.type,
      isRequired: parsed.data.isRequired,
    },
  })

  revalidateFeedback()
  return { success: "Question updated." }
}

export async function deleteFeedbackQuestion(formData: FormData) {
  const formId = z.string().uuid().safeParse(formData.get("formId"))
  const questionId = z.string().uuid().safeParse(formData.get("questionId"))
  if (!formId.success || !questionId.success) return

  const access = await managedForm(formId.data)
  if ("error" in access || access.form.status !== "DRAFT") return

  await prisma.feedbackQuestion.updateMany({
    where: { id: questionId.data, formId: access.form.id, isDeleted: false },
    data: { isDeleted: true },
  })
  revalidateFeedback()
}

export async function deleteFeedbackForm(
  _previousState: FeedbackManagementState,
  formData: FormData
): Promise<FeedbackManagementState> {
  const formId = z.string().uuid().safeParse(formData.get("formId"))
  if (!formId.success)
    return { error: "This feedback form could not be identified." }

  const access = await managedForm(formId.data)
  if ("error" in access) return { error: access.error }

  const submittedCount = await prisma.formAccess.count({
    where: {
      formId: access.form.id,
      isDeleted: false,
      isSubmitted: true,
    },
  })
  if (submittedCount > 0) {
    return {
      error:
        "This form has submitted feedback and cannot be deleted. Close it instead to preserve its results.",
    }
  }

  await prisma.$transaction(async (tx) => {
    const overrides = await tx.feedbackFormOverride.findMany({
      where: { feedbackFormId: access.form.id, isDeleted: false },
      select: { id: true },
    })
    const overrideIds = overrides.map((override) => override.id)

    await tx.formAccess.updateMany({
      where: { formId: access.form.id, isDeleted: false },
      data: { isDeleted: true },
    })
    await tx.feedbackQuestion.updateMany({
      where: { formId: access.form.id, isDeleted: false },
      data: { isDeleted: true },
    })
    if (overrideIds.length > 0) {
      await tx.overrideStudent.updateMany({
        where: {
          feedbackFormOverrideId: { in: overrideIds },
          isDeleted: false,
        },
        data: { isDeleted: true },
      })
      await tx.feedbackFormOverride.updateMany({
        where: { id: { in: overrideIds }, isDeleted: false },
        data: { isDeleted: true },
      })
    }
    await tx.feedbackForm.update({
      where: { id: access.form.id },
      data: { isDeleted: true, isExpired: true, status: "CLOSED" },
    })
  })

  revalidateFeedback()
  return { success: "Feedback form deleted." }
}

export async function uploadFeedbackStudents(
  _previousState: FeedbackManagementState,
  formData: FormData
): Promise<FeedbackManagementState> {
  const formId = z.string().uuid().safeParse(formData.get("formId"))
  if (!formId.success)
    return { error: "This feedback form could not be identified." }

  const access = await managedForm(formId.data)
  if ("error" in access) return { error: access.error }
  if (access.form.status !== "DRAFT") {
    return {
      error: "Student lists can only be replaced while a form is in draft.",
    }
  }

  const file = formData.get("studentList")
  if (
    !file ||
    typeof file !== "object" ||
    !("arrayBuffer" in file) ||
    !("size" in file) ||
    !("name" in file)
  ) {
    return { error: "Choose a student-list Excel file." }
  }
  if (!/\.xlsx$/i.test(String(file.name)))
    return { error: "Upload an .xlsx student list." }
  if (Number(file.size) === 0 || Number(file.size) > 5 * 1024 * 1024) {
    return { error: "Use a non-empty Excel file smaller than 5 MB." }
  }

  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(await file.arrayBuffer())
  } catch {
    return {
      error: "The selected file could not be read as an Excel workbook.",
    }
  }
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return { error: "The workbook does not contain a worksheet." }
  const studentColumns = findStudentUploadColumns(worksheet)
  if (!studentColumns) {
    return {
      error:
        "Could not find student headers. Include Student Name (or Name) and Email ID (or Email).",
    }
  }
  if (worksheet.rowCount - studentColumns.headerRow > 2_000) {
    return { error: "Import up to 2,000 student rows at a time." }
  }

  const rows: z.infer<typeof studentRowSchema>[] = []
  let skipped = 0
  const emails = new Set<string>()
  for (
    let rowNumber = studentColumns.headerRow + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber)
    if (!row.hasValues) continue
    const parsed = studentRowSchema.safeParse({
      name: cellValue(row.getCell(studentColumns.name).value),
      email: cellValue(row.getCell(studentColumns.email).value),
      enrollmentNumber: studentColumns.enrollmentNumber
        ? cellValue(row.getCell(studentColumns.enrollmentNumber).value)
        : "",
      batch: studentColumns.batch
        ? cellValue(row.getCell(studentColumns.batch).value)
        : "",
      phoneNumber: studentColumns.phoneNumber
        ? cellValue(row.getCell(studentColumns.phoneNumber).value)
        : "",
    })
    if (!parsed.success || emails.has(parsed.data?.email ?? "")) {
      skipped += 1
      continue
    }
    emails.add(parsed.data.email)
    rows.push(parsed.data)
  }
  if (rows.length === 0) {
    return {
      error:
        "No valid students were found. Check that the Name and Email values are present on each student row.",
    }
  }

  await prisma.$transaction(async (tx) => {
    const override = await tx.feedbackFormOverride.findFirst({
      where: { feedbackFormId: access.form.id, isDeleted: false },
      select: { id: true },
    })
    const activeOverride = override
      ? await tx.feedbackFormOverride.update({
          where: { id: override.id },
          data: { uploadedAt: new Date(), uploadedBy: access.admin.id },
          select: { id: true },
        })
      : await tx.feedbackFormOverride.create({
          data: { feedbackFormId: access.form.id, uploadedBy: access.admin.id },
          select: { id: true },
        })

    await tx.formAccess.updateMany({
      where: {
        formId: access.form.id,
        overrideStudent: {
          feedbackFormOverrideId: activeOverride.id,
          isDeleted: false,
        },
      },
      data: { isDeleted: true },
    })
    await tx.overrideStudent.updateMany({
      where: { feedbackFormOverrideId: activeOverride.id, isDeleted: false },
      data: { isDeleted: true },
    })

    const masterStudents = await tx.student.findMany({
      where: {
        isDeleted: false,
        OR: [
          { email: { in: rows.map((row) => row.email) } },
          {
            enrollmentNumber: {
              in: rows.map((row) => row.enrollmentNumber).filter(Boolean),
            },
          },
        ],
      },
      select: { id: true, email: true, enrollmentNumber: true },
    })
    const mastersByEmail = new Map(
      masterStudents.map((student) => [student.email, student])
    )
    const mastersByEnrollment = new Map(
      masterStudents.map((student) => [student.enrollmentNumber, student])
    )

    const overrideValues = Prisma.join(
      rows.map((row) => {
        const linkedStudent =
          mastersByEnrollment.get(row.enrollmentNumber) ??
          mastersByEmail.get(row.email)
        return Prisma.sql`(
          ${randomUUID()}, ${activeOverride.id}, ${row.name}, ${row.email},
          ${row.enrollmentNumber || null}, ${row.batch || null},
          ${row.phoneNumber || null}, ${linkedStudent?.id ?? null}
        )`
      })
    )
    const overrideStudents = await tx.$queryRaw<
      { id: string; email: string }[]
    >(Prisma.sql`
      INSERT INTO override_students (
        id, feedback_form_override_id, name, email, enrollment_number,
        batch, "phoneNumber", student_id
      ) VALUES ${overrideValues}
      ON CONFLICT (feedback_form_override_id, email) DO UPDATE SET
        name = EXCLUDED.name,
        enrollment_number = EXCLUDED.enrollment_number,
        batch = EXCLUDED.batch,
        "phoneNumber" = EXCLUDED."phoneNumber",
        student_id = EXCLUDED.student_id,
        is_deleted = false
      RETURNING id, email
    `)
    const accessValues = Prisma.join(
      overrideStudents.map(
        (student) =>
          Prisma.sql`(
          ${randomUUID()}, ${access.form.id}, ${student.id},
          ${randomBytes(16).toString("hex")}, NOW(), NOW()
        )`
      )
    )
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO form_access (
        id, form_id, override_student_id, access_token, created_at, updated_at
      )
      VALUES ${accessValues}
      ON CONFLICT (form_id, override_student_id) DO UPDATE SET
        is_deleted = false,
        updated_at = NOW()
    `)
  })

  revalidateFeedback()
  return {
    success: `Student list replaced with ${rows.length} eligible student${rows.length === 1 ? "" : "s"}.`,
    result: { imported: rows.length, skipped },
  }
}
