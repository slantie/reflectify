"use server"

import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

const yearSchema = z.object({
  yearString: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Use the format YYYY-YYYY, for example 2026-2027.")
    .refine(
      (value) => Number(value.slice(5)) === Number(value.slice(0, 4)) + 1,
      "The end year must follow the start year."
    ),
  activation: z.enum(["ACTIVE", "INACTIVE"]),
})

const departmentSchema = z.object({
  collegeId: z.string().uuid("Choose a college."),
  name: z.string().trim().min(2, "Enter a department name.").max(160),
  abbreviation: z
    .string()
    .trim()
    .min(2, "Enter a department abbreviation.")
    .max(32)
    .transform((value) => value.toUpperCase()),
  hodName: z.string().trim().min(2, "Enter the HOD's name.").max(160),
  hodEmail: z
    .string()
    .trim()
    .email("Enter a valid HOD email.")
    .max(320)
    .transform((value) => value.toLowerCase()),
})

const collegeSchema = z.object({
  name: z.string().trim().min(2, "Enter a college name.").max(200),
  websiteUrl: z.string().trim().url("Enter a valid website URL.").max(500),
  address: z.string().trim().min(5, "Enter a college address.").max(500),
  contactNumber: z.string().trim().min(6, "Enter a contact number.").max(40),
})

const semesterSchema = z
  .object({
    departmentId: z.string().uuid("Choose a department."),
    academicYearId: z.string().uuid("Choose an academic year."),
    semesterNumber: z.coerce.number().int().min(1).max(12),
    semesterType: z.enum(["ODD", "EVEN"]),
    startDate: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
        "Choose a valid start date."
      ),
    endDate: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
        "Choose a valid end date."
      ),
  })
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.startDate <= value.endDate,
    { message: "End date must be after the start date.", path: ["endDate"] }
  )

const divisionSchema = z.object({
  departmentId: z.string().uuid("Choose a department."),
  semesterId: z.string().uuid("Choose a semester."),
  divisionName: z
    .string()
    .trim()
    .min(1, "Enter a division name.")
    .max(32)
    .transform((value) => value.toUpperCase()),
  studentCount: z.coerce
    .number()
    .int()
    .min(0, "Student count cannot be negative.")
    .max(5000),
})

type FormState<T extends z.ZodType> = {
  error?: string
  success?: string
  fieldErrors?: Partial<Record<keyof z.input<T>, string[]>>
}
export type AcademicYearActionState = FormState<typeof yearSchema>
export type CollegeActionState = FormState<typeof collegeSchema>
export type DepartmentActionState = FormState<typeof departmentSchema>
export type SemesterActionState = FormState<typeof semesterSchema>
export type DivisionActionState = FormState<typeof divisionSchema>

async function canManageAcademicSetup() {
  const admin = await getCurrentAdmin()
  return Boolean(admin && (admin.isSuper || admin.designation === "HOD"))
}

function refreshAcademicPaths() {
  updateTag("analytics")
  revalidatePath("/academic-years")
  revalidatePath("/colleges")
  revalidatePath("/departments")
  revalidatePath("/semesters")
  revalidatePath("/divisions")
  revalidatePath("/subjects")
  revalidatePath("/faculty")
  revalidatePath("/allocations")
  revalidatePath("/dashboard")
  revalidatePath("/analytics")
}

export async function createCollege(
  _previousState: CollegeActionState,
  formData: FormData
): Promise<CollegeActionState> {
  if (!(await canManageAcademicSetup())) {
    return { error: "You are not allowed to manage colleges." }
  }
  const parsed = collegeSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl"),
    address: formData.get("address"),
    contactNumber: formData.get("contactNumber"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await prisma.college.create({ data: parsed.data })
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "A college with this name already exists." }
    }
    return { error: "The college could not be created. Please try again." }
  }

  refreshAcademicPaths()
  return { success: "College created successfully." }
}

export async function createAcademicYear(
  _previousState: AcademicYearActionState,
  formData: FormData
): Promise<AcademicYearActionState> {
  if (!(await canManageAcademicSetup()))
    return { error: "You are not allowed to manage academic years." }
  const parsed = yearSchema.safeParse({
    yearString: formData.get("yearString"),
    activation: formData.get("activation"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.activation === "ACTIVE")
        await tx.academicYear.updateMany({
          where: { isDeleted: false },
          data: { isActive: false },
        })
      await tx.academicYear.create({
        data: {
          yearString: parsed.data.yearString,
          isActive: parsed.data.activation === "ACTIVE",
        },
      })
    })
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return { error: "This academic year already exists." }
    return {
      error: "The academic year could not be created. Please try again.",
    }
  }

  refreshAcademicPaths()
  return { success: "Academic year created successfully." }
}

export async function setActiveAcademicYear(academicYearId: string) {
  if (!(await canManageAcademicSetup())) return
  const year = await prisma.academicYear.findFirst({
    where: { id: academicYearId, isDeleted: false },
    select: { id: true },
  })
  if (!year) return
  await prisma.$transaction([
    prisma.academicYear.updateMany({
      where: { isDeleted: false },
      data: { isActive: false },
    }),
    prisma.academicYear.update({
      where: { id: academicYearId },
      data: { isActive: true },
    }),
  ])
  refreshAcademicPaths()
}

export async function createDepartment(
  _previousState: DepartmentActionState,
  formData: FormData
): Promise<DepartmentActionState> {
  if (!(await canManageAcademicSetup()))
    return { error: "You are not allowed to manage departments." }
  const parsed = departmentSchema.safeParse({
    collegeId: formData.get("collegeId"),
    name: formData.get("name"),
    abbreviation: formData.get("abbreviation"),
    hodName: formData.get("hodName"),
    hodEmail: formData.get("hodEmail"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  const college = await prisma.college.findFirst({
    where: { id: parsed.data.collegeId, isDeleted: false },
    select: { id: true },
  })
  if (!college) return { error: "Choose an active college." }
  try {
    await prisma.department.create({ data: parsed.data })
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return {
        error:
          "This department name or abbreviation already exists for the college.",
      }
    return { error: "The department could not be created. Please try again." }
  }
  refreshAcademicPaths()
  return { success: "Department created successfully." }
}

export async function createSemester(
  _previousState: SemesterActionState,
  formData: FormData
): Promise<SemesterActionState> {
  if (!(await canManageAcademicSetup()))
    return { error: "You are not allowed to manage semesters." }
  const parsed = semesterSchema.safeParse({
    departmentId: formData.get("departmentId"),
    academicYearId: formData.get("academicYearId"),
    semesterNumber: formData.get("semesterNumber"),
    semesterType: formData.get("semesterType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  const [department, academicYear] = await prisma.$transaction([
    prisma.department.findFirst({
      where: { id: parsed.data.departmentId, isDeleted: false },
      select: { id: true },
    }),
    prisma.academicYear.findFirst({
      where: { id: parsed.data.academicYearId, isDeleted: false },
      select: { id: true },
    }),
  ])
  if (!department || !academicYear)
    return { error: "Choose active department and academic year records." }
  try {
    await prisma.semester.create({
      data: {
        departmentId: parsed.data.departmentId,
        academicYearId: parsed.data.academicYearId,
        semesterNumber: parsed.data.semesterNumber,
        semesterType: parsed.data.semesterType,
        startDate: parsed.data.startDate
          ? new Date(`${parsed.data.startDate}T00:00:00.000Z`)
          : null,
        endDate: parsed.data.endDate
          ? new Date(`${parsed.data.endDate}T00:00:00.000Z`)
          : null,
      },
    })
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return {
        error:
          "This semester is already configured for the department and academic year.",
      }
    return { error: "The semester could not be created. Please try again." }
  }
  refreshAcademicPaths()
  return { success: "Semester created successfully." }
}

export async function createDivision(
  _previousState: DivisionActionState,
  formData: FormData
): Promise<DivisionActionState> {
  if (!(await canManageAcademicSetup()))
    return { error: "You are not allowed to manage divisions." }
  const parsed = divisionSchema.safeParse({
    departmentId: formData.get("departmentId"),
    semesterId: formData.get("semesterId"),
    divisionName: formData.get("divisionName"),
    studentCount: formData.get("studentCount"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  const semester = await prisma.semester.findFirst({
    where: {
      id: parsed.data.semesterId,
      departmentId: parsed.data.departmentId,
      isDeleted: false,
    },
    select: { id: true },
  })
  if (!semester)
    return { error: "Choose a semester belonging to the selected department." }
  try {
    await prisma.division.create({ data: parsed.data })
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return {
        error: "This division already exists for the selected semester.",
      }
    return { error: "The division could not be created. Please try again." }
  }
  refreshAcademicPaths()
  return { success: "Division created successfully." }
}
