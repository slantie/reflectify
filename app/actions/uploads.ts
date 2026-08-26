"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"
import { processFacultyMatrix } from "@/lib/matrix/processor"

const matrixParameters = z.object({
  academicYearId: z.string().uuid("Choose an academic year."),
  departmentId: z.string().uuid("Choose a department."),
  semesterRun: z.enum(["ODD", "EVEN"]),
})

export type MatrixPreviewState = {
  error?: string
  success?: string
  fieldErrors?: Partial<
    Record<keyof z.input<typeof matrixParameters>, string[]>
  >
  summary?: { divisions: number; timetableEntries: number; warnings: string[] }
}

export async function previewFacultyMatrix(
  _previousState: MatrixPreviewState,
  formData: FormData
): Promise<MatrixPreviewState> {
  const admin = await getCurrentAdmin()
  if (!admin?.isSuper)
    return { error: "Only Super Admins can analyse data uploads." }

  const parsed = matrixParameters.safeParse({
    academicYearId: formData.get("academicYearId"),
    departmentId: formData.get("departmentId"),
    semesterRun: formData.get("semesterRun"),
  })
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors }

  const file = formData.get("facultyMatrix")
  if (
    !file ||
    typeof file !== "object" ||
    !("arrayBuffer" in file) ||
    !("size" in file) ||
    !("name" in file)
  ) {
    return { error: "Choose a Faculty Matrix Excel file." }
  }
  if (!/\.xlsx$/i.test(String(file.name)))
    return { error: "Upload an .xlsx Faculty Matrix file." }
  if (Number(file.size) === 0 || Number(file.size) > 10 * 1024 * 1024)
    return { error: "Use a non-empty .xlsx file smaller than 10 MB." }

  const [academicYear, department] = await prisma.$transaction([
    prisma.academicYear.findFirst({
      where: { id: parsed.data.academicYearId, isDeleted: false },
      select: { id: true },
    }),
    prisma.department.findFirst({
      where: { id: parsed.data.departmentId, isDeleted: false },
      select: { abbreviation: true },
    }),
  ])
  if (!academicYear || !department)
    return { error: "Choose active academic year and department records." }

  const result = await processFacultyMatrix(
    await file.arrayBuffer(),
    department.abbreviation
  )
  const divisionTimetables = result.division_timetables ?? {}
  const parsedSemesters = Object.values(result.results)
    .flatMap((college) => Object.values(college))
    .flatMap((departmentData) => Object.keys(departmentData))
  const warnings = result.status.errors.slice(0, 12)

  if (!result.status.success && Object.keys(divisionTimetables).length === 0) {
    return {
      error: result.status.message,
      summary: { divisions: 0, timetableEntries: 0, warnings },
    }
  }

  return {
    success: result.status.success
      ? "Matrix parsed successfully. Review the summary before committing the import."
      : "Matrix parsed with warnings. Review each warning before committing the import.",
    summary: {
      divisions: Object.keys(divisionTimetables).length,
      timetableEntries: Object.values(divisionTimetables).reduce(
        (total, entries) => total + entries.length,
        0
      ),
      warnings: [
        ...warnings,
        `Detected ${parsedSemesters.length} semester group${parsedSemesters.length === 1 ? "" : "s"} in the matrix.`,
      ],
    },
  }
}
