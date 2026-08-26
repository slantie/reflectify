"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

const scheduleSchema = z
  .object({
    academicYearId: z.string().uuid("Choose an academic year."),
    departmentId: z.string().uuid("Choose a department."),
    scheduleStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid start date."),
    scheduleEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid closing date."),
    selections: z.string().min(2, "Select at least one division."),
  })
  .refine((value) => value.scheduleStart <= value.scheduleEnd, {
    message: "The closing date must be on or after the start date.",
    path: ["scheduleEnd"],
  })

const selectionSchema = z
  .array(
    z.object({
      semesterId: z.string().uuid(),
      divisionId: z.string().uuid(),
    })
  )
  .min(1, "Select at least one division.")
  .max(120, "Too many divisions were selected at once.")

export type FeedbackScheduleState = {
  error?: string
  success?: string
  fieldErrors?: Partial<Record<keyof z.input<typeof scheduleSchema>, string[]>>
  result?: {
    created: number
    alreadyScheduled: number
    withoutAllocations: number
  }
}

const questionCategories = [
  {
    id: "lecture-feedback",
    categoryName: "Lecture Feedback",
    description: "Feedback for theory lectures",
  },
  {
    id: "lab-feedback",
    categoryName: "Laboratory Feedback",
    description: "Feedback for laboratory sessions",
  },
] as const

async function canScheduleFeedback() {
  const admin = await getCurrentAdmin()
  return Boolean(admin?.isSuper)
}

export async function createFeedbackSchedule(
  _previousState: FeedbackScheduleState,
  formData: FormData
): Promise<FeedbackScheduleState> {
  if (!(await canScheduleFeedback())) {
    return { error: "Only Super Admins can schedule feedback forms." }
  }

  const parsed = scheduleSchema.safeParse({
    academicYearId: formData.get("academicYearId"),
    departmentId: formData.get("departmentId"),
    scheduleStart: formData.get("scheduleStart"),
    scheduleEnd: formData.get("scheduleEnd"),
    selections: formData.get("selections"),
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  let selections: z.infer<typeof selectionSchema>
  try {
    selections = selectionSchema.parse(JSON.parse(parsed.data.selections))
  } catch {
    return {
      error: "The selected divisions could not be read. Please try again.",
    }
  }

  const uniqueSelections = [
    ...new Map(
      selections.map((selection) => [
        `${selection.semesterId}:${selection.divisionId}`,
        selection,
      ])
    ).values(),
  ]

  const [department, academicYear] = await Promise.all([
    prisma.department.findFirst({
      where: { id: parsed.data.departmentId, isDeleted: false },
      select: { id: true, abbreviation: true },
    }),
    prisma.academicYear.findFirst({
      where: { id: parsed.data.academicYearId, isDeleted: false },
      select: { id: true },
    }),
  ])
  if (!department || !academicYear) {
    return { error: "Choose an active academic year and department." }
  }

  const validDivisions = await prisma.division.findMany({
    where: {
      isDeleted: false,
      departmentId: department.id,
      id: { in: uniqueSelections.map((selection) => selection.divisionId) },
      semester: {
        isDeleted: false,
        academicYearId: academicYear.id,
        id: { in: uniqueSelections.map((selection) => selection.semesterId) },
      },
    },
    select: {
      id: true,
      divisionName: true,
      semester: { select: { id: true, semesterNumber: true } },
    },
  })
  const validDivisionKeys = new Set(
    validDivisions.map((division) => `${division.semester.id}:${division.id}`)
  )
  if (validDivisionKeys.size !== uniqueSelections.length) {
    return {
      error:
        "One or more selected divisions no longer belong to the chosen academic year and department.",
    }
  }

  const startDate = new Date(`${parsed.data.scheduleStart}T00:00:00.000Z`)
  const endDate = new Date(`${parsed.data.scheduleEnd}T23:59:59.999Z`)

  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const category of questionCategories) {
        await tx.questionCategory.upsert({
          where: { id: category.id },
          update: { isDeleted: false },
          create: { ...category, isDeleted: false },
        })
      }

      let created = 0
      let alreadyScheduled = 0
      let withoutAllocations = 0

      for (const division of validDivisions) {
        const existingForm = await tx.feedbackForm.findFirst({
          where: {
            divisionId: division.id,
            isDeleted: false,
            subjectAllocation: {
              isDeleted: false,
              semesterId: division.semester.id,
            },
          },
          select: { id: true },
        })
        if (existingForm) {
          alreadyScheduled += 1
          continue
        }

        const allocations = await tx.subjectAllocation.findMany({
          where: {
            isDeleted: false,
            departmentId: department.id,
            semesterId: division.semester.id,
            divisionId: division.id,
            academicYearId: academicYear.id,
            lectureType: { in: ["LECTURE", "LAB"] },
            faculty: { isDeleted: false },
            subject: { isDeleted: false },
          },
          select: {
            id: true,
            batch: true,
            lectureType: true,
            faculty: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true, type: true } },
          },
          orderBy: [
            { lectureType: "asc" },
            { subject: { subjectCode: "asc" } },
          ],
        })
        if (allocations.length === 0) {
          withoutAllocations += 1
          continue
        }

        await tx.feedbackForm.create({
          data: {
            divisionId: division.id,
            subjectAllocationId: allocations[0].id,
            title: `${department.abbreviation} ${division.semester.semesterNumber}${division.divisionName} - Student Feedback Form`,
            status: "DRAFT",
            startDate,
            endDate,
            accessHash: randomBytes(16).toString("hex"),
            questions: {
              create: allocations.map((allocation, index) => {
                const isLecture = allocation.lectureType === "LECTURE"
                const batch =
                  allocation.batch && allocation.batch !== "-"
                    ? allocation.batch
                    : "None"
                return {
                  categoryId: isLecture ? "lecture-feedback" : "lab-feedback",
                  facultyId: allocation.faculty.id,
                  subjectId: allocation.subject.id,
                  batch,
                  text: `Rate ${allocation.faculty.name} in Subject: ${allocation.subject.name} (${isLecture ? "Theory" : "Lab"}) - ${batch}`,
                  type: "rating",
                  isRequired: allocation.subject.type !== "ELECTIVE",
                  displayOrder: index + 1,
                }
              }),
            },
          },
        })
        created += 1
      }

      return { created, alreadyScheduled, withoutAllocations }
    })

    revalidatePath("/feedback-forms")
    revalidatePath("/dashboard")
    return {
      success:
        result.created > 0
          ? `${result.created} draft feedback ${result.created === 1 ? "form was" : "forms were"} scheduled.`
          : "No new feedback forms were scheduled.",
      result,
    }
  } catch {
    return {
      error:
        "The feedback schedule could not be created. No partial schedules were saved.",
    }
  }
}
