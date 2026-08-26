import "server-only"

import { unstable_cache } from "next/cache"
import { cache } from "react"

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth/session"

export type CurrentAdmin = {
  id: string
  name: string
  email: string
  designation: "SUPER_ADMIN" | "HOD" | "AsstProf" | "LabAsst"
  isSuper: boolean
}

const getCachedAdmin = unstable_cache(
  async (adminId: string): Promise<CurrentAdmin | null> =>
    prisma.admin.findFirst({
      where: { id: adminId, isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        isSuper: true,
      },
    }),
  ["current-admin"],
  { revalidate: 60, tags: ["admin-session"] }
)

export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const session = await getSession()
  if (!session) return null

  return getCachedAdmin(session.adminId)
})

export async function getDashboardOverview() {
  const [
    activeAcademicYear,
    academicYears,
    colleges,
    departments,
    semesters,
    divisions,
    students,
    faculty,
    subjects,
    allocations,
    feedbackForms,
  ] = await Promise.all([
    prisma.academicYear.findFirst({
      where: { isDeleted: false, isActive: true },
      select: { yearString: true },
    }),
    prisma.academicYear.count({ where: { isDeleted: false } }),
    prisma.college.count({ where: { isDeleted: false } }),
    prisma.department.count({ where: { isDeleted: false } }),
    prisma.semester.count({ where: { isDeleted: false } }),
    prisma.division.count({ where: { isDeleted: false } }),
    prisma.student.count({ where: { isDeleted: false } }),
    prisma.faculty.count({ where: { isDeleted: false } }),
    prisma.subject.count({ where: { isDeleted: false } }),
    prisma.subjectAllocation.count({ where: { isDeleted: false } }),
    prisma.feedbackForm.groupBy({
      by: ["status"],
      where: { isDeleted: false, isExpired: false },
      _count: { _all: true },
    }),
  ])

  const feedback = new Map(
    feedbackForms.map((form) => [form.status, form._count._all])
  )

  return {
    activeAcademicYear: activeAcademicYear?.yearString ?? null,
    academicYears,
    colleges,
    departments,
    semesters,
    divisions,
    students,
    faculty,
    subjects,
    allocations,
    feedback: {
      draft: feedback.get("DRAFT") ?? 0,
      active: feedback.get("ACTIVE") ?? 0,
      closed: feedback.get("CLOSED") ?? 0,
    },
  }
}
