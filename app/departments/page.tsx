import {
  BookOpenTextIcon,
  BuildingsIcon,
  CalendarDotsIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { DepartmentCreateDialog } from "@/components/academic/create-dialogs"
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

export default async function DepartmentsPage() {
  const [admin, colleges, departments] = await Promise.all([
    getCurrentAdmin(),
    prisma.college.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        hodName: true,
        hodEmail: true,
        college: { select: { name: true } },
        _count: {
          select: {
            faculties: { where: { isDeleted: false } },
            semesters: { where: { isDeleted: false } },
            subjects: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ])
  const canManage = Boolean(
    admin && (admin.isSuper || admin.designation === "HOD")
  )
  const facultyCount = departments.reduce(
    (total, department) => total + department._count.faculties,
    0
  )
  const semesterCount = departments.reduce(
    (total, department) => total + department._count.semesters,
    0
  )
  const subjectCount = departments.reduce(
    (total, department) => total + department._count.subjects,
    0
  )
  return (
    <div className="space-y-5 md:space-y-6">
      <Header
        eyebrow="Academic structure"
        title="Departments"
        description="Manage the academic homes for faculty, semesters, divisions, and subjects."
        action={
          canManage ? <DepartmentCreateDialog colleges={colleges} /> : null
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ModuleMetricCard
          icon={BuildingsIcon}
          label="Active departments"
          value={departments.length}
          detail="configured for the institution"
          href="/departments"
        />
        <ModuleMetricCard
          icon={CalendarDotsIcon}
          label="Semester runs"
          value={semesterCount}
          detail="across active departments"
          href="/semesters"
        />
        <ModuleMetricCard
          icon={UsersThreeIcon}
          label="Faculty profiles"
          value={facultyCount}
          detail="across all departments"
          href="/faculty"
        />
        <ModuleMetricCard
          icon={BookOpenTextIcon}
          label="Subjects"
          value={subjectCount}
          detail="in department catalogues"
          href="/subjects"
        />
      </section>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b px-5 py-5 md:px-6">
            <p className="font-medium">Department directory</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ownership and academic inventory for each active department.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">Department</TableHead>
                <TableHead>HOD</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Academic records
                </TableHead>
                <TableHead className="px-5 text-right md:px-6">
                  Faculty
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="px-5 py-3 md:px-6">
                    <p className="font-medium">{department.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {department.abbreviation} · {department.college.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{department.hodName}</p>
                    <p className="max-w-48 truncate text-xs text-muted-foreground">
                      {department.hodEmail}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-sm tabular-nums">
                      {department._count.semesters} semesters ·{" "}
                      {department._count.subjects} subjects
                    </p>
                  </TableCell>
                  <TableCell className="px-5 text-right md:px-6">
                    <Badge variant="outline">
                      {department._count.faculties}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <EmptyRow
                  columns={4}
                  message="No departments have been configured yet."
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
