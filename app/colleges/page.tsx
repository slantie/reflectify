import {
  BuildingsIcon,
  GraduationCapIcon,
} from "@phosphor-icons/react/dist/ssr"

import { CollegeCreateDialog } from "@/components/academic/create-dialogs"
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

export default async function CollegesPage() {
  const [admin, colleges] = await Promise.all([
    getCurrentAdmin(),
    prisma.college.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        address: true,
        contactNumber: true,
        _count: { select: { departments: { where: { isDeleted: false } } } },
      },
      orderBy: { name: "asc" },
    }),
  ])
  const canManage = Boolean(
    admin && (admin.isSuper || admin.designation === "HOD")
  )
  const departmentCount = colleges.reduce(
    (total, college) => total + college._count.departments,
    0
  )
  return (
    <div className="space-y-5 md:space-y-6">
      <Header
        eyebrow="Institution"
        title="Colleges"
        description="Manage institutional records that own and organize academic departments."
        action={canManage ? <CollegeCreateDialog /> : null}
      />
      <section className="grid gap-4 sm:grid-cols-2">
        <ModuleMetricCard
          icon={BuildingsIcon}
          label="College records"
          value={colleges.length}
          detail="active institutions"
          href="/colleges"
        />
        <ModuleMetricCard
          icon={GraduationCapIcon}
          label="Departments"
          value={departmentCount}
          detail="across active colleges"
          href="/departments"
        />
      </section>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b px-5 py-5 md:px-6">
            <p className="font-medium">Institution directory</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact and web details used for institutional context.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 md:px-6">College</TableHead>
                <TableHead className="hidden lg:table-cell">Website</TableHead>
                <TableHead className="hidden xl:table-cell">Contact</TableHead>
                <TableHead className="px-5 text-right md:px-6">
                  Departments
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.map((college) => (
                <TableRow key={college.id}>
                  <TableCell className="px-5 py-3 md:px-6">
                    <p className="font-medium">{college.name}</p>
                    <p className="max-w-72 truncate text-xs text-muted-foreground">
                      {college.address}
                    </p>
                  </TableCell>
                  <TableCell className="hidden max-w-52 truncate text-muted-foreground lg:table-cell">
                    {college.websiteUrl}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">
                    {college.contactNumber}
                  </TableCell>
                  <TableCell className="px-5 text-right md:px-6">
                    <Badge variant="outline">
                      {college._count.departments}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {colleges.length === 0 && (
                <EmptyRow
                  columns={4}
                  message="No colleges have been added yet."
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
