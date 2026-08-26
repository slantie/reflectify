import Image from "next/image"
import { notFound } from "next/navigation"
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr"

import { StudentFeedbackForm } from "@/components/feedback/student-feedback-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/db"

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function isGeneralQuestion(questionBatch: string) {
  return !questionBatch || questionBatch === "None" || questionBatch === "-"
}

export default async function PublicFeedbackPage({
  params,
}: {
  params: Promise<{ accessToken: string }>
}) {
  const { accessToken } = await params
  const access = await prisma.formAccess.findFirst({
    where: { accessToken, isDeleted: false },
    select: {
      isSubmitted: true,
      student: { select: { batch: true } },
      overrideStudent: { select: { batch: true } },
      form: {
        select: {
          title: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          isDeleted: true,
          division: {
            select: {
              divisionName: true,
              department: { select: { name: true } },
              semester: { select: { semesterNumber: true } },
            },
          },
          questions: {
            where: { isDeleted: false },
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              text: true,
              type: true,
              batch: true,
              isRequired: true,
              category: { select: { categoryName: true } },
              faculty: { select: { name: true, abbreviation: true } },
              subject: { select: { name: true, subjectCode: true } },
            },
          },
        },
      },
    },
  })
  if (!access || access.form.isDeleted) notFound()

  const now = new Date()
  const open =
    access.form.status === "ACTIVE" &&
    now >= access.form.startDate &&
    now <= access.form.endDate
  const suggestedBatch = access.overrideStudent?.batch ?? access.student?.batch
  const availableBatches = [
    ...new Set(
      access.form.questions
        .map((question) => question.batch)
        .filter((batch) => !isGeneralQuestion(batch))
    ),
  ].sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true })
  )
  const questions = access.form.questions.map((question) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    batch: question.batch,
    isRequired: question.isRequired,
    category: question.category.categoryName,
    faculty: question.faculty.abbreviation ?? question.faculty.name,
    subject: `${question.subject.subjectCode} · ${question.subject.name}`,
  }))

  return (
    <main className="min-h-svh bg-muted/30 px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 text-center sm:mb-7">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border sm:size-11">
            <Image
              src="/reflectify-logo.svg"
              alt="Reflectify"
              width={44}
              height={44}
              priority
              className="size-8 sm:size-9"
            />
          </div>
          <p className="mt-4 text-sm font-medium text-primary">Reflectify</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">
            {access.form.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {access.form.division.department.name} · Semester{" "}
            {access.form.division.semester.semesterNumber} · Division{" "}
            {access.form.division.divisionName}
          </p>
        </div>

        {!open || access.isSubmitted ? (
          <Card className="shadow-sm">
            <CardContent className="px-6 py-10 text-center">
              <LockKeyIcon className="mx-auto size-9 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">
                {access.isSubmitted
                  ? "Feedback already submitted"
                  : "Feedback window is unavailable"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {access.isSubmitted
                  ? "Thank you for sharing your feedback."
                  : `This form is available until ${dateLabel(access.form.endDate)}.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4 shadow-sm sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge>Anonymous feedback</Badge>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {access.form.description ||
                        "Your responses are collected securely and used to improve the academic experience."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-center min-[420px]:grid-cols-2 sm:min-w-52 sm:gap-3">
                    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                      <p className="text-lg font-semibold tabular-nums">
                        {questions.length}
                      </p>
                      <p className="text-xs text-muted-foreground">questions</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                      <p className="text-sm font-semibold">
                        {dateLabel(access.form.endDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">closes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <StudentFeedbackForm
              accessToken={accessToken}
              questions={questions}
              availableBatches={availableBatches}
              suggestedBatch={
                suggestedBatch && availableBatches.includes(suggestedBatch)
                  ? suggestedBatch
                  : undefined
              }
            />
          </>
        )}
      </div>
    </main>
  )
}
