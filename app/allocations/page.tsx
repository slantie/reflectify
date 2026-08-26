import { redirect } from "next/navigation"
import {
  BookOpenTextIcon,
  UsersThreeIcon,
  UserListIcon,
} from "@phosphor-icons/react/dist/ssr"

import { AllocationCreateDialog } from "@/components/allocations/allocation-create-dialog"
import { ModuleMetricCard } from "@/components/module-metric-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

const lectureTypeLabel = {
  LECTURE: "Lecture",
  LAB: "Lab",
  TUTORIAL: "Tutorial",
  SEMINAR: "Seminar",
  PROJECT: "Project",
} as const

export default async function AllocationsPage() {
  const [
    admin,
    allocations,
    departments,
    academicYears,
    semesters,
    divisions,
    subjects,
    faculties,
  ] = await Promise.all([
    getCurrentAdmin(),
    prisma.subjectAllocation.findMany({
      where: {
        isDeleted: false,
        faculty: { isDeleted: false },
        subject: { isDeleted: false },
        division: { isDeleted: false },
        semester: { isDeleted: false },
        department: { isDeleted: false },
        academicYear: { isDeleted: false },
      },
      select: {
        id: true,
        batch: true,
        lectureType: true,
        faculty: { select: { name: true, abbreviation: true } },
        subject: { select: { name: true, subjectCode: true } },
        division: { select: { divisionName: true } },
        semester: { select: { semesterNumber: true, semesterType: true } },
        department: { select: { abbreviation: true } },
        academicYear: { select: { yearString: true, isActive: true } },
      },
      orderBy: [
        { academicYear: { yearString: "desc" } },
        { department: { abbreviation: "asc" } },
        { semester: { semesterNumber: "asc" } },
        { subject: { subjectCode: "asc" } },
      ],
    }),
    prisma.department.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
    prisma.academicYear.findMany({
      where: { isDeleted: false },
      select: { id: true, yearString: true, isActive: true },
      orderBy: { yearString: "desc" },
    }),
    prisma.semester.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        departmentId: true,
        academicYearId: true,
        semesterNumber: true,
        semesterType: true,
      },
      orderBy: [{ semesterNumber: "asc" }, { semesterType: "asc" }],
    }),
    prisma.division.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        departmentId: true,
        semesterId: true,
        divisionName: true,
      },
      orderBy: { divisionName: "asc" },
    }),
    prisma.subject.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        departmentId: true,
        semesterId: true,
        name: true,
        subjectCode: true,
      },
      orderBy: { subjectCode: "asc" },
    }),
    prisma.faculty.findMany({
      where: { isDeleted: false },
      select: { id: true, departmentId: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!admin) redirect("/login")
  const canManage = admin.isSuper || admin.designation === "HOD"
  const lectureCount = allocations.filter(
    (allocation) => allocation.lectureType === "LECTURE"
  ).length
  const activeFaculty = new Set(
    allocations.map((allocation) => allocation.faculty.name)
  ).size

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Academic structure</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Teaching allocations
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The source of truth linking faculty members, subjects, divisions,
            and teaching activities.
          </p>
        </div>
        {canManage && (
          <AllocationCreateDialog
            departments={departments}
            academicYears={academicYears}
            semesters={semesters}
            divisions={divisions}
            subjects={subjects}
            faculties={faculties}
          />
        )}
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <ModuleMetricCard
          icon={UserListIcon}
          label="Active allocations"
          value={allocations.length}
          detail="across all academic years"
          href="/allocations"
        />
        <ModuleMetricCard
          icon={BookOpenTextIcon}
          label="Lecture allocations"
          value={lectureCount}
          detail="core teaching assignments"
          href="/subjects"
        />
        <ModuleMetricCard
          icon={UsersThreeIcon}
          label="Assigned faculty"
          value={activeFaculty}
          detail="with at least one allocation"
          href="/faculty"
        />
      </section>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
              <p className="font-medium">Allocation register</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the active academic teaching plan before creating
                feedback forms.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              Live register
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">
                  Faculty & subject
                </TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Academic year
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  Department
                </TableHead>
                <TableHead className="px-5 text-right md:px-6">Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell className="px-5 py-3 md:px-6">
                    <div>
                      <p className="font-medium">
                        {allocation.faculty.name}
                        {allocation.faculty.abbreviation ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {allocation.faculty.abbreviation}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {allocation.subject.subjectCode} ·{" "}
                        {allocation.subject.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    Sem {allocation.semester.semesterNumber} · Div{" "}
                    {allocation.division.divisionName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        allocation.lectureType === "LAB"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {lectureTypeLabel[allocation.lectureType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {allocation.academicYear.yearString}
                    {allocation.academicYear.isActive ? (
                      <span className="text-primary"> · Active</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Badge variant="outline">
                      {allocation.department.abbreviation}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 text-right font-mono text-xs md:px-6">
                    {allocation.batch}
                  </TableCell>
                </TableRow>
              ))}
              {allocations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-8 text-center text-muted-foreground md:px-6"
                  >
                    No teaching allocations have been added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
