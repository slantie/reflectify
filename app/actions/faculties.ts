"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

const facultySchema = z.object({
  name: z.string().trim().min(2, "Enter the faculty member's name.").max(160),
  abbreviation: z
    .string()
    .trim()
    .max(32)
    .transform((value) => value.toUpperCase()),
  email: z
    .string()
    .trim()
    .email("Enter a valid institutional email.")
    .max(320)
    .transform((value) => value.toLowerCase()),
  designation: z.enum(["HOD", "AsstProf", "LabAsst"]),
  seatingLocation: z
    .string()
    .trim()
    .min(2, "Enter a seating location.")
    .max(160),
  joiningDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid joining date."),
  departmentId: z.string().uuid("Choose a department."),
})

export type FacultyActionState = {
  error?: string
  success?: string
  fieldErrors?: Partial<Record<keyof z.input<typeof facultySchema>, string[]>>
}

function createAbbreviation(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export async function createFaculty(
  _previousState: FacultyActionState,
  formData: FormData
): Promise<FacultyActionState> {
  const admin = await getCurrentAdmin()
  if (!admin || (!admin.isSuper && admin.designation !== "HOD")) {
    return { error: "You are not allowed to create faculty profiles." }
  }

  const parsed = facultySchema.safeParse({
    name: formData.get("name"),
    abbreviation: formData.get("abbreviation"),
    email: formData.get("email"),
    designation: formData.get("designation"),
    seatingLocation: formData.get("seatingLocation"),
    joiningDate: formData.get("joiningDate"),
    departmentId: formData.get("departmentId"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { departmentId, abbreviation, joiningDate, ...faculty } = parsed.data
  const department = await prisma.department.findFirst({
    where: { id: departmentId, isDeleted: false },
    select: { id: true },
  })

  if (!department) return { error: "Choose an active department." }

  try {
    await prisma.faculty.create({
      data: {
        ...faculty,
        abbreviation: abbreviation || createAbbreviation(faculty.name),
        joiningDate: new Date(`${joiningDate}T00:00:00.000Z`),
        departmentId,
      },
    })
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        error: "A faculty profile already exists with this email address.",
      }
    }

    return {
      error: "The faculty profile could not be created. Please try again.",
    }
  }

  revalidatePath("/faculty")
  revalidatePath("/dashboard")
  return { success: "Faculty profile created successfully." }
}
