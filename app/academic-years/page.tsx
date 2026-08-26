import {
  CalendarDotsIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { setActiveAcademicYear } from "@/app/actions/academic"
import { AcademicYearCreateDialog } from "@/components/academic/create-dialogs"
import { ModuleMetricCard } from "@/components/module-metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export default async function AcademicYearsPage() {
  const [admin, academicYears] = await Promise.all([
    getCurrentAdmin(),
    prisma.academicYear.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        yearString: true,
        isActive: true,
        _count: {
          select: {
            semesters: { where: { isDeleted: false } },
            students: { where: { isDeleted: false } },
            subjectAllocations: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { yearString: "desc" },
    }),
  ])
  const canManage = Boolean(
    admin && (admin.isSuper || admin.designation === "HOD")
  )
  const activeYear = academicYears.find((year) => year.isActive)
  return (
    <div className="space-y-5 md:space-y-6">
      <Header
        eyebrow="Academic structure"
        title="Academic years"
        description="Manage the academic calendar used by semesters, student records, and teaching allocations."
        action={canManage ? <AcademicYearCreateDialog /> : null}
      />
      <section className="grid gap-4 sm:grid-cols-2">
        <ModuleMetricCard
          icon={CalendarDotsIcon}
          label="Configured years"
          value={academicYears.length}
          detail="available in the academic record"
          href="/academic-years"
        />
        <ModuleMetricCard
          icon={CheckCircleIcon}
          label="Active year"
          value={activeYear ? 1 : 0}
          detail={
            activeYear ? activeYear.yearString : "Select one to continue setup"
          }
          href="/semesters"
        />
      </section>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b px-5 py-5 md:px-6">
            <p className="font-medium">Academic calendar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Only one year can be active at a time.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">Academic year</TableHead>
                <TableHead>Semesters</TableHead>
                <TableHead className="hidden sm:table-cell">Students</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Allocations
                </TableHead>
                <TableHead className="px-5 text-right md:px-6">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {academicYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="px-5 py-3 font-medium md:px-6">
                    {year.yearString}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {year._count.semesters}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {year._count.students}
                  </TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">
                    {year._count.subjectAllocations}
                  </TableCell>
                  <TableCell className="px-5 text-right md:px-6">
                    {year.isActive ? (
                      <Badge>Active</Badge>
                    ) : canManage ? (
                      <form
                        action={setActiveAcademicYear.bind(null, year.id)}
                        className="inline-flex"
                      >
                        <Button type="submit" size="sm" variant="outline">
                          Set active
                        </Button>
                      </form>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {academicYears.length === 0 && (
                <EmptyRow
                  columns={5}
                  message="No academic years have been configured yet."
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
