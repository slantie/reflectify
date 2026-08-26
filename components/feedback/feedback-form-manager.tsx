"use client"

import { useActionState, useState } from "react"
import {
  DownloadSimpleIcon,
  FileArrowUpIcon,
  PencilSimpleIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TrashIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import {
  createFeedbackQuestion,
  deleteFeedbackQuestion,
  sendFeedbackInvitations,
  updateFeedbackForm,
  updateFeedbackQuestion,
  uploadFeedbackStudents,
  type FeedbackManagementState,
} from "@/app/actions/feedback-management"
import { useActionToast } from "@/components/feedback/use-action-toast"
import { DeleteFeedbackFormDialog } from "@/components/feedback/delete-feedback-form-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { referenceFiles } from "@/lib/upload/reference-files"

type Question = {
  id: string
  categoryId: string
  facultyId: string
  subjectId: string
  batch: string
  text: string
  type: string
  isRequired: boolean
  displayOrder: number
  category: { categoryName: string }
  faculty: { name: string; abbreviation: string | null }
  subject: { name: string; subjectCode: string }
}

type ImportedStudent = {
  id: string
  name: string
  email: string
  enrollmentNumber: string | null
  batch: string | null
}

type Option = { id: string; name: string }

type Form = {
  id: string
  title: string
  description: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  startDate: string
  endDate: string
  context: string
  divisionStudents: number
  accessCount: number
  submittedAccesses: number
  questions: Question[]
  importedStudents: ImportedStudent[]
  importedStudentCount: number
}

const initialState: FeedbackManagementState = {}

export function FeedbackFormManager({
  form,
  categories,
  faculties,
  subjects,
}: {
  form: Form
  categories: { id: string; categoryName: string }[]
  faculties: (Option & { abbreviation: string | null })[]
  subjects: (Option & { subjectCode: string })[]
}) {
  const draft = form.status === "DRAFT"

  return (
    <Tabs defaultValue="details" className="gap-5">
      <div className="overflow-x-auto pb-1">
        <TabsList className="min-w-max">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">
            Questions{" "}
            <span className="text-xs text-muted-foreground">
              {form.questions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="students">
            Student list
            <span className="text-xs text-muted-foreground">
              {form.importedStudentCount}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="details">
        <DetailsPanel form={form} />
      </TabsContent>
      <TabsContent value="questions">
        <QuestionsPanel
          form={form}
          categories={categories}
          faculties={faculties}
          subjects={subjects}
          draft={draft}
        />
      </TabsContent>
      <TabsContent value="students">
        <StudentsPanel form={form} draft={draft} />
      </TabsContent>
    </Tabs>
  )
}

function DetailsPanel({ form }: { form: Form }) {
  const [status, setStatus] = useState<Form["status"]>(form.status)
  const [state, formAction, pending] = useActionState(
    updateFeedbackForm,
    initialState
  )
  useActionToast(state)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Form details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update the form label, feedback window, and availability status.
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="formId" value={form.id} />
            <input type="hidden" name="status" value={status} />
            <StateMessage state={state} />
            <div className="space-y-2">
              <Label htmlFor="feedback-form-title">Form title</Label>
              <Input
                id="feedback-form-title"
                name="title"
                defaultValue={form.title}
                required
              />
              <FieldError state={state} field="title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-form-description">Description</Label>
              <Textarea
                id="feedback-form-description"
                name="description"
                defaultValue={form.description}
                placeholder="Optional instructions shown with the feedback form."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus((value ?? "DRAFT") as Form["status"])
                  }
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-start-date">Opens</Label>
                <Input
                  id="feedback-start-date"
                  name="startDate"
                  type="date"
                  defaultValue={form.startDate}
                  required
                />
                <FieldError state={state} field="startDate" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-end-date">Closes</Label>
                <Input
                  id="feedback-end-date"
                  name="endDate"
                  type="date"
                  defaultValue={form.endDate}
                  required
                />
                <FieldError state={state} field="endDate" />
              </div>
            </div>
            <div className="flex justify-end border-t pt-5">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="h-fit shadow-sm">
        <CardContent className="space-y-4 p-5">
          <p className="font-medium">Audience snapshot</p>
          <Info label="Teaching group" value={form.context} />
          <Info
            label="Division roster"
            value={`${form.divisionStudents} students`}
          />
          <Info label="Issued access links" value={`${form.accessCount}`} />
          <Info
            label="Completed feedback"
            value={`${form.submittedAccesses}`}
          />
          <InvitationDelivery
            formId={form.id}
            active={form.status === "ACTIVE"}
          />
          <div className="border-t pt-4">
            <p className="text-sm font-medium">Danger zone</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Delete draft or unused forms that were created by mistake.
            </p>
            <div className="mt-3">
              <DeleteFeedbackFormDialog formId={form.id} returnToList />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InvitationDelivery({
  formId,
  active,
}: {
  formId: string
  active: boolean
}) {
  const [state, formAction, pending] = useActionState(
    sendFeedbackInvitations,
    initialState
  )
  useActionToast(state)

  return (
    <div className="border-t pt-4">
      <p className="text-sm font-medium">Invitation delivery</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {active
          ? "Send a fresh invitation to every recipient who has not submitted feedback."
          : "Activate the form to send recipient invitations."}
      </p>
      <form action={formAction}>
        <input type="hidden" name="formId" value={formId} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="mt-3"
          disabled={!active || pending}
        >
          <PaperPlaneTiltIcon />
          {pending ? "Sending…" : "Send invitations"}
        </Button>
      </form>
      {state.warning && (
        <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-400">
          {state.warning}
        </p>
      )}
    </div>
  )
}

function QuestionsPanel({
  form,
  categories,
  faculties,
  subjects,
  draft,
}: {
  form: Form
  categories: { id: string; categoryName: string }[]
  faculties: (Option & { abbreviation: string | null })[]
  subjects: (Option & { subjectCode: string })[]
  draft: boolean
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Feedback questions</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Questions are generated from allocations and can be adjusted before
            the form is activated.
          </p>
        </div>
        <QuestionDialog
          formId={form.id}
          categories={categories}
          faculties={faculties}
          subjects={subjects}
          disabled={!draft}
        />
      </CardHeader>
      <CardContent>
        {!draft && (
          <Alert className="mb-5">
            <WarningCircleIcon weight="fill" />
            <AlertTitle>Question set is locked</AlertTitle>
            <AlertDescription>
              Return the form to Draft to make structural changes.
            </AlertDescription>
          </Alert>
        )}
        {form.questions.length === 0 ? (
          <div className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
            No questions are available on this form yet.
          </div>
        ) : (
          <div className="divide-y rounded-xl border">
            {form.questions.map((question) => (
              <div
                key={question.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {question.category.categoryName}
                    </Badge>
                    <Badge variant="outline">
                      {question.isRequired ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <p className="mt-3 font-medium">{question.text}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {question.faculty.name} · {question.subject.subjectCode} ·{" "}
                    {question.batch === "None"
                      ? "All batches"
                      : `Batch ${question.batch}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <QuestionDialog
                    formId={form.id}
                    question={question}
                    categories={categories}
                    faculties={faculties}
                    subjects={subjects}
                    disabled={!draft}
                  />
                  <DeleteQuestionDialog
                    formId={form.id}
                    questionId={question.id}
                    disabled={!draft}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuestionDialog({
  formId,
  question,
  categories,
  faculties,
  subjects,
  disabled,
}: {
  formId: string
  question?: Question
  categories: { id: string; categoryName: string }[]
  faculties: (Option & { abbreviation: string | null })[]
  subjects: (Option & { subjectCode: string })[]
  disabled: boolean
}) {
  const action = question ? updateFeedbackQuestion : createFeedbackQuestion
  const [state, formAction, pending] = useActionState(action, initialState)
  const [open, setOpen] = useState(false)
  useActionToast(state)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant={question ? "outline" : "default"}
            disabled={disabled}
          />
        }
      >
        {question ? <PencilSimpleIcon /> : <PlusIcon weight="bold" />}
        {question ? "Edit" : "Add question"}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {question ? "Edit question" : "Add question"}
          </DialogTitle>
          <DialogDescription>
            Questions must use faculty and subject records from this teaching
            group.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="formId" value={formId} />
          {question && (
            <input type="hidden" name="questionId" value={question.id} />
          )}
          <StateMessage state={state} />
          <div className="space-y-2">
            <Label
              htmlFor={
                question ? `question-text-${question.id}` : "new-question-text"
              }
            >
              Question
            </Label>
            <Textarea
              id={
                question ? `question-text-${question.id}` : "new-question-text"
              }
              name="text"
              defaultValue={question?.text}
              required
            />
            <FieldError state={state} field="text" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <OptionSelect
              label="Category"
              name="categoryId"
              options={categories.map((category) => ({
                id: category.id,
                name: category.categoryName,
              }))}
              defaultValue={question?.categoryId}
            />
            <OptionSelect
              label="Faculty"
              name="facultyId"
              options={faculties.map((faculty) => ({
                id: faculty.id,
                name: faculty.abbreviation
                  ? `${faculty.name} · ${faculty.abbreviation}`
                  : faculty.name,
              }))}
              defaultValue={question?.facultyId}
            />
            <OptionSelect
              label="Subject"
              name="subjectId"
              options={subjects.map((subject) => ({
                id: subject.id,
                name: `${subject.subjectCode} · ${subject.name}`,
              }))}
              defaultValue={question?.subjectId}
            />
            <div className="space-y-2">
              <Label
                htmlFor={
                  question
                    ? `question-batch-${question.id}`
                    : "new-question-batch"
                }
              >
                Batch
              </Label>
              <Input
                id={
                  question
                    ? `question-batch-${question.id}`
                    : "new-question-batch"
                }
                name="batch"
                defaultValue={question?.batch === "None" ? "" : question?.batch}
                placeholder="All batches"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label
                htmlFor={
                  question
                    ? `question-required-${question.id}`
                    : "new-question-required"
                }
              >
                Required response
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Students must answer this question before submitting.
              </p>
            </div>
            <Checkbox
              id={
                question
                  ? `question-required-${question.id}`
                  : "new-question-required"
              }
              name="isRequired"
              defaultChecked={question?.isRequired ?? true}
            />
          </div>
          <input type="hidden" name="type" value="rating" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : question
                  ? "Save question"
                  : "Add question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteQuestionDialog({
  formId,
  questionId,
  disabled,
}: {
  formId: string
  questionId: string
  disabled: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={disabled}
            aria-label="Delete question"
            title="Delete question"
          />
        }
      >
        <TrashIcon className="text-destructive" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this question?</DialogTitle>
          <DialogDescription>
            The question will be removed from this draft and will no longer be
            shown to students.
          </DialogDescription>
        </DialogHeader>
        <form action={deleteFeedbackQuestion}>
          <input type="hidden" name="formId" value={formId} />
          <input type="hidden" name="questionId" value={questionId} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" variant="destructive">
              Remove question
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StudentsPanel({ form, draft }: { form: Form; draft: boolean }) {
  const [state, formAction, pending] = useActionState(
    uploadFeedbackStudents,
    initialState
  )
  useActionToast(state)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Student list</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a form-specific audience when the feedback recipients differ
            from the division roster.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {!draft ? (
            <Alert>
              <WarningCircleIcon weight="fill" />
              <AlertTitle>Student list is locked</AlertTitle>
              <AlertDescription>
                Return the form to Draft to replace its recipients.
              </AlertDescription>
            </Alert>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="formId" value={form.id} />
              <StateMessage state={state} />
              <div className="rounded-xl border border-dashed bg-muted/20 p-5">
                <FileArrowUpIcon
                  className="size-7 text-primary"
                  weight="duotone"
                />
                <p className="mt-3 font-medium">Replace the student list</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use an .xlsx file with Student Name (or Name) and Email ID (or
                  Email). Enrollment Number, Batch, and Phone are optional.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  render={
                    <a
                      href={referenceFiles.studentData}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <DownloadSimpleIcon />
                  Open reference file
                </Button>
                <Input
                  className="mt-3"
                  name="studentList"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="mt-4"
                  disabled={pending}
                >
                  {pending ? "Importing…" : "Import student list"}
                </Button>
              </div>
            </form>
          )}
          {state.result && (
            <p className="text-sm text-muted-foreground">
              {state.result.imported} imported · {state.result.skipped} skipped
            </p>
          )}
          <StudentTable
            students={form.importedStudents}
            total={form.importedStudentCount}
          />
        </CardContent>
      </Card>
      <Card className="h-fit shadow-sm">
        <CardContent className="p-5">
          <UsersThreeIcon className="size-6 text-primary" weight="fill" />
          <p className="mt-4 font-medium">Recipient coverage</p>
          <div className="mt-4 space-y-3">
            <Info
              label="Division roster"
              value={`${form.divisionStudents} students`}
            />
            <Info
              label="Imported recipients"
              value={`${form.importedStudentCount}`}
            />
            <Info label="Issued access links" value={`${form.accessCount}`} />
            <Info label="Submissions" value={`${form.submittedAccesses}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentTable({
  students,
  total,
}: {
  students: ImportedStudent[]
  total: number
}) {
  if (students.length === 0)
    return (
      <div className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
        No form-specific student list has been uploaded.
      </div>
    )
  return (
    <div className="overflow-x-auto rounded-xl border">
      {total > students.length && (
        <p className="border-b px-4 py-3 text-xs text-muted-foreground">
          Showing the first {students.length} of {total} imported students.
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Enrollment</TableHead>
            <TableHead className="px-4">Batch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="px-4 font-medium">{student.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {student.email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {student.enrollmentNumber ?? "—"}
              </TableCell>
              <TableCell className="px-4 text-muted-foreground">
                {student.batch ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function OptionSelect({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: Option[]
  defaultValue?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        name={name}
        defaultValue={defaultValue}
        items={options.map((option) => ({
          value: option.id,
          label: option.name,
        }))}
        required
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Choose ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function StateMessage({ state }: { state: FeedbackManagementState }) {
  if (!state.error && !state.success && !state.warning) return null
  return (
    <Alert variant={state.error ? "destructive" : "default"}>
      {state.error ? <WarningCircleIcon weight="fill" /> : null}
      <AlertTitle>
        {state.error
          ? "Could not save changes"
          : state.warning
            ? "Saved with a delivery warning"
            : "Saved"}
      </AlertTitle>
      <AlertDescription>
        {state.error ?? state.warning ?? state.success}
      </AlertDescription>
    </Alert>
  )
}

function FieldError({
  state,
  field,
}: {
  state: FeedbackManagementState
  field: string
}) {
  const message = state.fieldErrors?.[field]?.[0]
  return message ? <p className="text-xs text-destructive">{message}</p> : null
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
