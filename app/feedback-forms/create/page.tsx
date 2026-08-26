import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ScheduleWorkspace } from "@/components/feedback/schedule-workspace"
import { Button } from "@/components/ui/button"
import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

export default async function CreateFeedbackFormPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/login")
  if (!admin.isSuper) redirect("/feedback-forms")

  const [academicYears, departments] = await Promise.all([
    prisma.academicYear.findMany({
      where: { isDeleted: false },
      select: { id: true, yearString: true, isActive: true },
      orderBy: { yearString: "desc" },
    }),
    prisma.department.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        semesters: {
          where: { isDeleted: false },
          select: {
            id: true,
            semesterNumber: true,
            semesterType: true,
            academicYearId: true,
            divisions: {
              where: { isDeleted: false },
              select: {
                id: true,
                divisionName: true,
                studentCount: true,
                _count: {
                  select: {
                    subjectAllocations: {
                      where: {
                        isDeleted: false,
                        lectureType: { in: ["LECTURE", "LAB"] },
                      },
                    },
                  },
                },
              },
              orderBy: { divisionName: "asc" },
            },
          },
          orderBy: [{ semesterNumber: "asc" }, { semesterType: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
  ])

  const workspaceDepartments = departments.map((department) => ({
    id: department.id,
    name: department.name,
    abbreviation: department.abbreviation,
    semesters: department.semesters.map((semester) => ({
      id: semester.id,
      semesterNumber: semester.semesterNumber,
      semesterType: semester.semesterType,
      academicYearId: semester.academicYearId,
      divisions: semester.divisions.map((division) => ({
        id: division.id,
        divisionName: division.divisionName,
        studentCount: division.studentCount,
        allocationCount: division._count.subjectAllocations,
      })),
    })),
  }))

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-start gap-4 border-b pb-6">
        <Button
          variant="outline"
          size="icon"
          aria-label="Back to feedback forms"
          title="Back to feedback forms"
          render={<Link href="/feedback-forms" />}
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <div className="flex items-center gap-2 text-primary">
            <CalendarCheckIcon className="size-5" weight="fill" />
            <p className="text-sm font-medium">Feedback scheduling</p>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Schedule feedback forms
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure one feedback window, select ready teaching groups, and
            create drafts that can be reviewed before invitations are sent.
          </p>
        </div>
      </div>
      <ScheduleWorkspace
        academicYears={academicYears}
        departments={workspaceDepartments}
      />
    </div>
  )
}
