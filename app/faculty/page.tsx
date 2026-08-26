import { redirect } from "next/navigation"
import {
  BuildingsIcon,
  MapPinIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { FacultyCreateDialog } from "@/components/faculty/faculty-create-dialog"
import { ModuleMetricCard } from "@/components/module-metric-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

const designationLabel = {
  HOD: "Head of department",
  AsstProf: "Assistant professor",
  LabAsst: "Lab assistant",
  SUPER_ADMIN: "Super admin",
} as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default async function FacultyPage() {
  const [admin, faculties, departments] = await Promise.all([
    getCurrentAdmin(),
    prisma.faculty.findMany({
      where: { isDeleted: false, department: { isDeleted: false } },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        email: true,
        designation: true,
        seatingLocation: true,
        joiningDate: true,
        department: { select: { name: true, abbreviation: true } },
        _count: { select: { allocations: { where: { isDeleted: false } } } },
      },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.department.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!admin) redirect("/login")
  const canManage = admin.isSuper || admin.designation === "HOD"
  const allocatedFaculty = faculties.filter(
    (faculty) => faculty._count.allocations > 0
  ).length
  const departmentCount = new Set(
    faculties.map((faculty) => faculty.department.abbreviation)
  ).size

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Academic structure</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Faculty
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A single, current directory for teaching assignments, feedback
            forms, and academic reporting.
          </p>
        </div>
        {canManage && <FacultyCreateDialog departments={departments} />}
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <ModuleMetricCard
          icon={UsersThreeIcon}
          label="Active faculty"
          value={faculties.length}
          detail="available for assignments"
          href="/faculty"
        />
        <ModuleMetricCard
          icon={BuildingsIcon}
          label="Departments"
          value={departmentCount}
          detail="represented in this directory"
          href="/departments"
        />
        <ModuleMetricCard
          icon={MapPinIcon}
          label="Assigned faculty"
          value={allocatedFaculty}
          detail="with active teaching allocations"
          href="/allocations"
        />
      </section>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
              <p className="font-medium">Faculty directory</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {faculties.length} active profile
                {faculties.length === 1 ? "" : "s"} from the migrated academic
                dataset.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              Live directory
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">Faculty member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden xl:table-cell">Joined</TableHead>
                <TableHead className="px-5 text-right md:px-6">
                  Allocations
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculties.map((faculty) => (
                <TableRow key={faculty.id}>
                  <TableCell className="px-5 py-3 md:px-6">
                    <div className="flex min-w-52 items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {faculty.abbreviation || initials(faculty.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{faculty.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {faculty.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {faculty.department.abbreviation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {designationLabel[faculty.designation]}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {faculty.seatingLocation}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">
                    {faculty.joiningDate
                      ? new Intl.DateTimeFormat("en", {
                          month: "short",
                          year: "numeric",
                        }).format(faculty.joiningDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="px-5 text-right tabular-nums md:px-6">
                    {faculty._count.allocations}
                  </TableCell>
                </TableRow>
              ))}
              {faculties.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-8 text-center text-muted-foreground md:px-6"
                  >
                    No faculty profiles have been added yet.
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
