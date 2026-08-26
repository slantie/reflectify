"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

const allocationSchema = z.object({
  facultyId: z.string().uuid("Choose a faculty member."),
  subjectId: z.string().uuid("Choose a subject."),
  divisionId: z.string().uuid("Choose a division."),
  semesterId: z.string().uuid("Choose a semester."),
  departmentId: z.string().uuid("Choose a department."),
  academicYearId: z.string().uuid("Choose an academic year."),
  lectureType: z.enum(["LECTURE", "LAB", "TUTORIAL", "SEMINAR", "PROJECT"]),
  batch: z
    .string()
    .trim()
    .max(32, "Batch must be 32 characters or fewer.")
    .transform((value) => value || "-"),
})

export type AllocationActionState = {
  error?: string
  success?: string
  fieldErrors?: Partial<
    Record<keyof z.input<typeof allocationSchema>, string[]>
  >
}

export async function createAllocation(
  _previousState: AllocationActionState,
  formData: FormData
): Promise<AllocationActionState> {
  const admin = await getCurrentAdmin()
  if (!admin || (!admin.isSuper && admin.designation !== "HOD")) {
    return { error: "You are not allowed to create teaching allocations." }
  }

  const parsed = allocationSchema.safeParse({
    facultyId: formData.get("facultyId"),
    subjectId: formData.get("subjectId"),
    divisionId: formData.get("divisionId"),
    semesterId: formData.get("semesterId"),
    departmentId: formData.get("departmentId"),
    academicYearId: formData.get("academicYearId"),
    lectureType: formData.get("lectureType"),
    batch: formData.get("batch"),
  })

  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const [faculty, subject, division, semester, academicYear, department] =
    await prisma.$transaction([
      prisma.faculty.findFirst({
        where: { id: data.facultyId, isDeleted: false },
        select: { departmentId: true },
      }),
      prisma.subject.findFirst({
        where: { id: data.subjectId, isDeleted: false },
        select: { departmentId: true, semesterId: true },
      }),
      prisma.division.findFirst({
        where: { id: data.divisionId, isDeleted: false },
        select: { departmentId: true, semesterId: true },
      }),
      prisma.semester.findFirst({
        where: { id: data.semesterId, isDeleted: false },
        select: { departmentId: true, academicYearId: true },
      }),
      prisma.academicYear.findFirst({
        where: { id: data.academicYearId, isDeleted: false },
        select: { id: true },
      }),
      prisma.department.findFirst({
        where: { id: data.departmentId, isDeleted: false },
        select: { id: true },
      }),
    ])

  if (
    !faculty ||
    !subject ||
    !division ||
    !semester ||
    !academicYear ||
    !department
  ) {
    return {
      error: "One or more selected academic records are no longer available.",
    }
  }

  const relationshipsMatch =
    faculty.departmentId === data.departmentId &&
    subject.departmentId === data.departmentId &&
    subject.semesterId === data.semesterId &&
    division.departmentId === data.departmentId &&
    division.semesterId === data.semesterId &&
    semester.departmentId === data.departmentId &&
    semester.academicYearId === data.academicYearId

  if (!relationshipsMatch) {
    return {
      error:
        "The selected faculty, subject, division, semester, and academic year must belong to the same academic structure.",
    }
  }

  try {
    await prisma.subjectAllocation.create({ data })
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "This teaching allocation already exists." }
    }

    return { error: "The allocation could not be created. Please try again." }
  }

  revalidatePath("/allocations")
  revalidatePath("/dashboard")
  revalidatePath("/faculty")
  revalidatePath("/subjects")
  return { success: "Teaching allocation created successfully." }
}
