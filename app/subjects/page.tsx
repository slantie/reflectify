import { redirect } from "next/navigation"
import {
  BookOpenTextIcon,
  BuildingsIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { SubjectCreateDialog } from "@/components/subjects/subject-create-dialog"
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

export default async function SubjectsPage() {
  const [admin, subjects, departments, semesters] = await Promise.all([
    getCurrentAdmin(),
    prisma.subject.findMany({
      where: { isDeleted: false },
      include: {
        department: { select: { name: true, abbreviation: true } },
        semester: { select: { semesterNumber: true, semesterType: true } },
        _count: { select: { allocations: { where: { isDeleted: false } } } },
      },
      orderBy: [
        { department: { name: "asc" } },
        { semester: { semesterNumber: "asc" } },
        { subjectCode: "asc" },
      ],
    }),
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
  ])

  if (!admin) redirect("/login")
  const canManage = admin.isSuper || admin.designation === "HOD"

  const allocatedSubjects = subjects.filter(
    (subject) => subject._count.allocations > 0
  ).length
  const departmentCount = new Set(
    subjects.map((subject) => subject.department.abbreviation)
  ).size

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Academic structure</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Subjects
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The authoritative subject catalogue for feedback forms, teaching
            allocations, and academic reporting.
          </p>
        </div>
        {canManage && (
          <SubjectCreateDialog
            departments={departments}
            semesters={semesters}
          />
        )}
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <ModuleMetricCard
          icon={BookOpenTextIcon}
          label="Active subjects"
          value={subjects.length}
          detail="available in the catalogue"
          href="/subjects"
        />
        <ModuleMetricCard
          icon={BuildingsIcon}
          label="Departments"
          value={departmentCount}
          detail="represented by subjects"
          href="/departments"
        />
        <ModuleMetricCard
          icon={CheckCircleIcon}
          label="Allocated subjects"
          value={allocatedSubjects}
          detail="with active teaching allocations"
          href="/allocations"
        />
      </section>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
              <p className="font-medium">Subject catalogue</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {subjects.length} active subject
                {subjects.length === 1 ? "" : "s"} from the migrated academic
                dataset.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              Live catalogue
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="px-5 text-right md:px-6">
                  Allocations
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="px-5 py-3 md:px-6">
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {subject.abbreviation}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {subject.subjectCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {subject.department.abbreviation}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    Sem {subject.semester.semesterNumber}{" "}
                    <span className="text-muted-foreground">
                      {subject.semester.semesterType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        subject.type === "MANDATORY" ? "secondary" : "outline"
                      }
                    >
                      {subject.type === "MANDATORY" ? "Mandatory" : "Elective"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 text-right tabular-nums md:px-6">
                    {subject._count.allocations}
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-8 text-center text-muted-foreground md:px-6"
                  >
                    No subjects have been added yet.
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
