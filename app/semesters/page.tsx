import {
  CalendarDotsIcon,
  GraduationCapIcon,
} from "@phosphor-icons/react/dist/ssr"

import { SemesterCreateDialog } from "@/components/academic/create-dialogs"
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

export default async function SemestersPage() {
  const [admin, departments, academicYears, semesters] = await Promise.all([
    getCurrentAdmin(),
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
        semesterNumber: true,
        semesterType: true,
        startDate: true,
        endDate: true,
        department: { select: { abbreviation: true } },
        academicYear: { select: { yearString: true, isActive: true } },
        _count: {
          select: {
            divisions: { where: { isDeleted: false } },
            subjects: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: [
        { academicYear: { yearString: "desc" } },
        { department: { abbreviation: "asc" } },
        { semesterNumber: "asc" },
      ],
    }),
  ])
  const canManage = Boolean(
    admin && (admin.isSuper || admin.designation === "HOD")
  )
  const subjectCount = semesters.reduce(
    (total, semester) => total + semester._count.subjects,
    0
  )
  const divisionCount = semesters.reduce(
    (total, semester) => total + semester._count.divisions,
    0
  )
  return (
    <div className="space-y-5 md:space-y-6">
      <Header
        eyebrow="Academic structure"
        title="Semesters"
        description="Manage department semester runs across each academic year."
        action={
          canManage ? (
            <SemesterCreateDialog
              departments={departments}
              academicYears={academicYears}
            />
          ) : null
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <ModuleMetricCard
          icon={CalendarDotsIcon}
          label="Configured semesters"
          value={semesters.length}
          detail="department-year combinations"
          href="/semesters"
        />
        <ModuleMetricCard
          icon={GraduationCapIcon}
          label="Divisions"
          value={divisionCount}
          detail="attached to semester runs"
          href="/divisions"
        />
        <ModuleMetricCard
          icon={GraduationCapIcon}
          label="Attached subjects"
          value={subjectCount}
          detail="in active semester records"
          href="/subjects"
        />
      </section>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b px-5 py-5 md:px-6">
            <p className="font-medium">Semester register</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Each record ties department, academic year, structure, and
              optional dates together.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">Semester</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead className="hidden lg:table-cell">Dates</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Divisions
                </TableHead>
                <TableHead className="px-5 text-right md:px-6">
                  Subjects
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semesters.map((semester) => (
                <TableRow key={semester.id}>
                  <TableCell className="px-5 py-3 md:px-6">
                    <p className="font-medium">
                      Sem {semester.semesterNumber} · {semester.semesterType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {semester.department.abbreviation}
                    </p>
                  </TableCell>
                  <TableCell>
                    {semester.academicYear.yearString}
                    {semester.academicYear.isActive ? (
                      <Badge className="ml-2">Active</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {semester.startDate && semester.endDate
                      ? `${semester.startDate.toLocaleDateString()} – ${semester.endDate.toLocaleDateString()}`
                      : "Dates not set"}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {semester._count.divisions}
                  </TableCell>
                  <TableCell className="px-5 text-right tabular-nums md:px-6">
                    {semester._count.subjects}
                  </TableCell>
                </TableRow>
              ))}
              {semesters.length === 0 && (
                <EmptyRow
                  columns={5}
                  message="No semesters have been configured yet."
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
