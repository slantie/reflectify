import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  ClipboardTextIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { FeedbackFormManager } from "@/components/feedback/feedback-form-manager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

const statusLabel = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  CLOSED: "Closed",
} as const

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default async function FeedbackFormPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/login")
  if (!admin.isSuper) redirect("/feedback-forms")

  const form = await prisma.feedbackForm.findFirst({
    where: { id: formId, isDeleted: false },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      division: {
        select: {
          divisionName: true,
          studentCount: true,
          departmentId: true,
          semesterId: true,
          department: { select: { name: true, abbreviation: true } },
          semester: {
            select: {
              semesterNumber: true,
              semesterType: true,
              academicYear: { select: { yearString: true } },
            },
          },
        },
      },
      questions: {
        where: { isDeleted: false },
        select: {
          id: true,
          categoryId: true,
          facultyId: true,
          subjectId: true,
          batch: true,
          text: true,
          type: true,
          isRequired: true,
          displayOrder: true,
          category: { select: { categoryName: true } },
          faculty: { select: { name: true, abbreviation: true } },
          subject: { select: { name: true, subjectCode: true } },
        },
        orderBy: { displayOrder: "asc" },
      },
      _count: {
        select: {
          formAccess: { where: { isDeleted: false } },
        },
      },
    },
  })
  if (!form) notFound()

  const [
    categories,
    faculties,
    subjects,
    importedStudents,
    importedStudentCount,
    submittedAccesses,
  ] = await Promise.all([
    prisma.questionCategory.findMany({
      where: { isDeleted: false },
      select: { id: true, categoryName: true },
      orderBy: { categoryName: "asc" },
    }),
    prisma.faculty.findMany({
      where: { departmentId: form.division.departmentId, isDeleted: false },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      where: {
        departmentId: form.division.departmentId,
        semesterId: form.division.semesterId,
        isDeleted: false,
      },
      select: { id: true, name: true, subjectCode: true },
      orderBy: { subjectCode: "asc" },
    }),
    prisma.overrideStudent.findMany({
      where: {
        isDeleted: false,
        feedbackFormOverride: { feedbackFormId: form.id, isDeleted: false },
      },
      select: {
        id: true,
        name: true,
        email: true,
        enrollmentNumber: true,
        batch: true,
      },
      orderBy: { name: "asc" },
      take: 250,
    }),
    prisma.overrideStudent.count({
      where: {
        isDeleted: false,
        feedbackFormOverride: { feedbackFormId: form.id, isDeleted: false },
      },
    }),
    prisma.formAccess.count({
      where: { formId: form.id, isDeleted: false, isSubmitted: true },
    }),
  ])

  const context = `${form.division.department.name} · Semester ${form.division.semester.semesterNumber} · Division ${form.division.divisionName}`

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="border-b pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          render={<Link href="/feedback-forms" />}
        >
          <ArrowLeftIcon /> All feedback forms
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-primary">
              <ClipboardTextIcon className="size-5" weight="fill" />
              <p className="text-sm font-medium">Feedback form management</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {form.title}
              </h1>
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
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {context} · {form.division.semester.academicYear.yearString}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2">
              <CalendarBlankIcon className="size-4" />
              {dateValue(form.startDate)} – {dateValue(form.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2">
              <UsersThreeIcon className="size-4" />
              {form._count.formAccess} recipients
            </span>
          </div>
        </div>
      </div>

      <FeedbackFormManager
        form={{
          id: form.id,
          title: form.title,
          description: form.description ?? "",
          status: form.status,
          startDate: dateValue(form.startDate),
          endDate: dateValue(form.endDate),
          context,
          divisionStudents: form.division.studentCount,
          accessCount: form._count.formAccess,
          submittedAccesses,
          questions: form.questions,
          importedStudents,
          importedStudentCount,
        }}
        categories={categories}
        faculties={faculties}
        subjects={subjects}
      />
    </div>
  )
}
