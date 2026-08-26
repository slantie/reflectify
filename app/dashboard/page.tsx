import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  BuildingsIcon,
  CalendarCheckIcon,
  CalendarDotsIcon,
  ClipboardTextIcon,
  FileArrowUpIcon,
  GraduationCapIcon,
  StudentIcon,
  UserListIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentAdmin, getDashboardOverview } from "@/lib/auth/dal"

const setupItems = [
  {
    label: "Academic years",
    detail: "Academic periods",
    key: "academicYears",
    href: "/academic-years",
    icon: CalendarDotsIcon,
  },
  {
    label: "Colleges",
    detail: "Institution profiles",
    key: "colleges",
    href: "/colleges",
    icon: BuildingsIcon,
  },
  {
    label: "Departments",
    detail: "Teaching departments",
    key: "departments",
    href: "/departments",
    icon: BuildingsIcon,
  },
  {
    label: "Semesters",
    detail: "Configured terms",
    key: "semesters",
    href: "/semesters",
    icon: CalendarDotsIcon,
  },
  {
    label: "Divisions",
    detail: "Teaching groups",
    key: "divisions",
    href: "/divisions",
    icon: UsersThreeIcon,
  },
  {
    label: "Subjects",
    detail: "Academic catalogue",
    key: "subjects",
    href: "/subjects",
    icon: GraduationCapIcon,
  },
] as const

export default async function DashboardPage() {
  const [admin, overview] = await Promise.all([
    getCurrentAdmin(),
    getDashboardOverview(),
  ])
  if (!admin) redirect("/login")

  const feedbackTotal =
    overview.feedback.draft +
    overview.feedback.active +
    overview.feedback.closed

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/12 via-background to-background">
        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              Academic feedback workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome back, {admin.name.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your academic catalogue is ready. Keep teaching data current, then
              schedule draft feedback forms when each group is prepared.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/feedback-forms" />}>
                <CalendarCheckIcon weight="fill" />
                Feedback schedule
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/upload" />}
              >
                <FileArrowUpIcon weight="bold" />
                Upload data
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Current academic year
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {overview.activeAcademicYear ?? "Not selected"}
            </p>
            <Badge
              variant={overview.activeAcademicYear ? "secondary" : "outline"}
              className="mt-4"
            >
              {overview.activeAcademicYear ? "Active" : "Needs setup"}
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Students"
          value={overview.students}
          detail="Imported student records"
          icon={StudentIcon}
        />
        <MetricCard
          label="Faculty"
          value={overview.faculty}
          detail="Active teaching profiles"
          icon={UsersThreeIcon}
          href="/faculty"
        />
        <MetricCard
          label="Allocations"
          value={overview.allocations}
          detail="Lecture and lab assignments"
          icon={UserListIcon}
          href="/allocations"
        />
        <MetricCard
          label="Feedback forms"
          value={feedbackTotal}
          detail={`${overview.feedback.active} active · ${overview.feedback.draft} draft`}
          icon={ClipboardTextIcon}
          href="/feedback-forms"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Academic setup
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage the records that power uploads, allocations, and
                feedback.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/subjects" />}
            >
              View subjects <ArrowRightIcon />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {setupItems.map(({ label, detail, key, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Card className="h-full transition-colors group-hover:border-primary/45 group-hover:bg-primary/[0.025]">
                  <CardContent className="px-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" weight="fill" />
                      </span>
                      <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-5 text-2xl font-semibold tabular-nums">
                      {overview[key].toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {detail}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <Card className="h-fit">
          <CardContent className="px-5 py-1">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpenTextIcon className="size-5" weight="fill" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Feedback readiness</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {overview.allocations > 0
                ? "Teaching allocations are available for form generation. Review groups and create drafts when the feedback window is confirmed."
                : "Add teaching allocations before generating feedback forms for your divisions."}
            </p>
            <div className="mt-5 space-y-3 border-t pt-4 text-sm">
              <StatusRow label="Draft forms" value={overview.feedback.draft} />
              <StatusRow
                label="Active forms"
                value={overview.feedback.active}
              />
              <StatusRow
                label="Closed forms"
                value={overview.feedback.closed}
              />
            </div>
            <Button
              className="mt-5 w-full"
              variant="outline"
              render={<Link href="/feedback-forms" />}
            >
              Manage feedback <ArrowRightIcon />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
}: {
  label: string
  value: number
  detail: string
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>
  href?: string
}) {
  const content = (
    <Card className="h-full">
      <CardContent className="px-4">
        <div className="flex items-start justify-between">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" weight="fill" />
          </span>
          {href && <ArrowRightIcon className="size-4 text-muted-foreground" />}
        </div>
        <p className="mt-6 text-3xl font-semibold tracking-tight tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="mt-1 text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )

  return href ? (
    <Link
      href={href}
      className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {content}
    </Link>
  ) : (
    content
  )
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value.toLocaleString()}</span>
    </div>
  )
}
