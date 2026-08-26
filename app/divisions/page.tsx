import { StudentIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr"

import { DivisionCreateDialog } from "@/components/academic/create-dialogs"
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

export default async function DivisionsPage() {
  const [admin, departments, semesters, divisions] = await Promise.all([
    getCurrentAdmin(),
    prisma.department.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
    prisma.semester.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        departmentId: true,
        semesterNumber: true,
        semesterType: true,
        academicYear: { select: { yearString: true } },
      },
      orderBy: [
        { academicYear: { yearString: "desc" } },
        { semesterNumber: "asc" },
      ],
    }),
    prisma.division.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        divisionName: true,
        studentCount: true,
        department: { select: { abbreviation: true } },
        semester: {
          select: {
            semesterNumber: true,
            semesterType: true,
            academicYear: { select: { yearString: true } },
          },
        },
        _count: {
          select: {
            students: { where: { isDeleted: false } },
            subjectAllocations: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: [
        { semester: { academicYear: { yearString: "desc" } } },
        { department: { abbreviation: "asc" } },
        { divisionName: "asc" },
      ],
    }),
  ])
  const canManage = Boolean(
    admin && (admin.isSuper || admin.designation === "HOD")
  )
  const expectedStudents = divisions.reduce(
    (total, division) => total + division.studentCount,
    0
  )
  const allocationCount = divisions.reduce(
    (total, division) => total + division._count.subjectAllocations,
    0
  )
  return (
    <div className="space-y-5 md:space-y-6">
      <Header
        eyebrow="Academic structure"
        title="Divisions"
        description="Manage student groups and the class context used by teaching allocations."
        action={
          canManage ? (
            <DivisionCreateDialog
              departments={departments}
              semesters={semesters}
            />
          ) : null
        }
      />
      <section className="grid gap-4 sm:grid-cols-2">
        <ModuleMetricCard
          icon={UsersThreeIcon}
          label="Configured divisions"
          value={divisions.length}
          detail="across active semesters"
          href="/divisions"
        />
        <ModuleMetricCard
          icon={StudentIcon}
          label="Teaching allocations"
          value={allocationCount}
          detail={`${expectedStudents} total expected student capacity`}
          href="/allocations"
        />
      </section>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b px-5 py-5 md:px-6">
            <p className="font-medium">Division register</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Capacity, student population, and teaching allocation coverage for
              each division.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">Division</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Academic year
                </TableHead>
                <TableHead className="hidden lg:table-cell">Students</TableHead>
                <TableHead className="px-5 text-right md:px-6">
                  Allocations
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.map((division) => (
                <TableRow key={division.id}>
                  <TableCell className="px-5 py-3 md:px-6">
                    <p className="font-medium">
                      Division {division.divisionName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {division.department.abbreviation}
                    </p>
                  </TableCell>
                  <TableCell>
                    Sem {division.semester.semesterNumber} ·{" "}
                    {division.semester.semesterType}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {division.semester.academicYear.yearString}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="tabular-nums">
                      {division._count.students} enrolled
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {division.studentCount} expected
                    </p>
                  </TableCell>
                  <TableCell className="px-5 text-right md:px-6">
                    <Badge variant="outline">
                      {division._count.subjectAllocations}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {divisions.length === 0 && (
                <EmptyRow
                  columns={5}
                  message="No divisions have been configured yet."
                />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Header({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
function EmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={columns}
        className="px-5 py-8 text-center text-muted-foreground md:px-6"
      >
        {message}
      </TableCell>
    </TableRow>
  )
}
