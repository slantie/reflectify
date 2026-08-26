"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

const subjectSchema = z.object({
  name: z.string().trim().min(2, "Enter a subject name.").max(160),
  abbreviation: z.string().trim().min(2, "Enter an abbreviation.").max(32).transform((value) => value.toUpperCase()),
  subjectCode: z.string().trim().min(2, "Enter a subject code.").max(48).transform((value) => value.toUpperCase()),
  type: z.enum(["MANDATORY", "ELECTIVE"]),
  departmentId: z.string().uuid("Choose a department."),
  semesterId: z.string().uuid("Choose a semester."),
})

export type SubjectActionState = {
  error?: string
  success?: string
  fieldErrors?: Partial<Record<keyof z.input<typeof subjectSchema>, string[]>>
}

export async function createSubject(
  _previousState: SubjectActionState,
  formData: FormData
): Promise<SubjectActionState> {
  const admin = await getCurrentAdmin()
  if (!admin || (!admin.isSuper && admin.designation !== "HOD")) {
    return { error: "You are not allowed to create subjects." }
  }

  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    abbreviation: formData.get("abbreviation"),
    subjectCode: formData.get("subjectCode"),
    type: formData.get("type"),
    departmentId: formData.get("departmentId"),
    semesterId: formData.get("semesterId"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { departmentId, semesterId, ...subject } = parsed.data
  const [department, semester] = await prisma.$transaction([
    prisma.department.findFirst({ where: { id: departmentId, isDeleted: false }, select: { id: true } }),
    prisma.semester.findFirst({ where: { id: semesterId, isDeleted: false }, select: { id: true, departmentId: true } }),
  ])

  if (!department || !semester || semester.departmentId !== departmentId) {
    return { error: "Choose a valid semester for the selected department." }
  }

  try {
    await prisma.subject.create({ data: { ...subject, departmentId, semesterId } })
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { error: "That abbreviation or subject code already exists for this semester." }
    }

    return { error: "The subject could not be created. Please try again." }
  }

  revalidatePath("/subjects")
  revalidatePath("/dashboard")
  return { success: "Subject created successfully." }
}
