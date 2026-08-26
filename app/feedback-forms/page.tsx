import Link from "next/link"
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  FileTextIcon,
  LinkSimpleIcon,
  PlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ModuleMetricCard } from "@/components/module-metric-card"
import { DeleteFeedbackFormDialog } from "@/components/feedback/delete-feedback-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/db"

const statuses = ["DRAFT", "ACTIVE", "CLOSED"] as const
type FeedbackStatus = (typeof statuses)[number]

const statusLabel: Record<FeedbackStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  CLOSED: "Closed",
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value)
}

export default async function FeedbackFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const selectedStatus = statuses.includes(status as FeedbackStatus)
    ? (status as FeedbackStatus)
    : undefined
  const [forms, formCounts] = await Promise.all([
    prisma.feedbackForm.findMany({
      where: {
        isDeleted: false,
        ...(selectedStatus ? { status: selectedStatus } : {}),
      },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        division: {
          select: {
            divisionName: true,
            department: { select: { name: true } },
            semester: {
              select: {
                semesterNumber: true,
                academicYear: { select: { yearString: true } },
              },
            },
          },
        },
        _count: {
          select: {
            questions: { where: { isDeleted: false } },
            formAccess: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.feedbackForm.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
  ])

  const counts = Object.fromEntries(
    formCounts.map((item) => [item.status, item._count._all])
  ) as Partial<Record<FeedbackStatus, number>>
  const total =
    (counts.DRAFT ?? 0) + (counts.ACTIVE ?? 0) + (counts.CLOSED ?? 0)

  return (
    <div className="space-y-5 md:space-y-6">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary">
              <ClipboardTextIcon className="size-5" weight="fill" />
              <p className="text-sm font-medium">Feedback</p>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Feedback forms
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Manage and monitor feedback schedules across departments.
            </p>
          </div>
          <Button size="lg" render={<Link href="/feedback-forms/create" />}>
            <PlusIcon weight="bold" /> Create feedback form
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ModuleMetricCard
          icon={FileTextIcon}
          label="All forms"
          value={total}
          detail="across all feedback windows"
          href="/feedback-forms"
        />
        <ModuleMetricCard
          icon={ClipboardTextIcon}
          label="Draft forms"
          value={counts.DRAFT ?? 0}
          detail="ready for review and activation"
          href="/feedback-forms?status=DRAFT"
        />
        <ModuleMetricCard
          icon={CheckCircleIcon}
          label="Active forms"
          value={counts.ACTIVE ?? 0}
          detail="currently collecting feedback"
          href="/feedback-forms?status=ACTIVE"
        />
        <ModuleMetricCard
          icon={CalendarBlankIcon}
          label="Closed forms"
          value={counts.CLOSED ?? 0}
          detail="completed feedback windows"
          href="/feedback-forms?status=CLOSED"
        />
      </section>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
              <p className="font-medium">Feedback forms</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {forms.length === 0
                  ? "No feedback forms in this view."
                  : `Showing ${forms.length} feedback form${forms.length === 1 ? "" : "s"}.`}
              </p>
            </div>
            {selectedStatus ? (
              <Badge variant="outline" render={<Link href="/feedback-forms" />}>
                Clear {statusLabel[selectedStatus].toLowerCase()} filter
              </Badge>
            ) : (
              <Badge variant="secondary">All statuses</Badge>
            )}
          </div>
          {forms.length > 0 ? (
            <div className="divide-y">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-muted/35 md:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{form.title}</p>
                      <Badge
                        variant={
                          form.status === "ACTIVE"
                            ? "default"
                            : form.status === "CLOSED"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {statusLabel[form.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarBlankIcon className="size-4" />
                        {formatDate(form.startDate)} –{" "}
                        {formatDate(form.endDate)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UsersThreeIcon className="size-4" />
                        {form.division.department.name} · Semester{" "}
                        {form.division.semester.semesterNumber} · Division{" "}
                        {form.division.divisionName}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarBlankIcon className="size-4" />
                        {form.division.semester.academicYear.yearString}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm text-muted-foreground lg:pl-4">
                    <span className="inline-flex items-center gap-1.5">
                      <ClipboardTextIcon className="size-4" />
                      {form._count.questions} questions
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <LinkSimpleIcon className="size-4" />
                      {form._count.formAccess} links
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link href={`/feedback-forms/${form.id}`} />}
                    >
                      Manage
                    </Button>
                    <DeleteFeedbackFormDialog formId={form.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-9 text-center md:px-6">
              <FileTextIcon className="mx-auto size-9 text-muted-foreground" />
              <p className="mt-3 font-medium">No feedback forms found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a feedback schedule after teaching allocations are ready.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
