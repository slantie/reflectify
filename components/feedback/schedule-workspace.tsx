"use client"

import { useActionState, useMemo, useState } from "react"
import {
  BuildingsIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import {
  createFeedbackSchedule,
  type FeedbackScheduleState,
} from "@/app/actions/feedback"
import { useActionToast } from "@/components/feedback/use-action-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type AcademicYear = { id: string; yearString: string; isActive: boolean }
type Division = {
  id: string
  divisionName: string
  studentCount: number
  allocationCount: number
}
type Semester = {
  id: string
  semesterNumber: number
  semesterType: "ODD" | "EVEN"
  academicYearId: string
  divisions: Division[]
}
type Department = {
  id: string
  name: string
  abbreviation: string
  semesters: Semester[]
}

const initialState: FeedbackScheduleState = {}

function dateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function groupKey(semesterId: string, divisionId: string) {
  return `${semesterId}:${divisionId}`
}

function semesterRun(type: Semester["semesterType"]) {
  return type === "ODD" ? "Odd semester" : "Even semester"
}

export function ScheduleWorkspace({
  academicYears,
  departments,
}: {
  academicYears: AcademicYear[]
  departments: Department[]
}) {
  const defaultYear =
    academicYears.find((academicYear) => academicYear.isActive) ??
    academicYears[0]
  const [academicYearId, setAcademicYearId] = useState(defaultYear?.id ?? "")
  const [departmentId, setDepartmentId] = useState("")
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [dateDefaults] = useState(() => {
    const opens = new Date()
    const closes = new Date(opens)
    closes.setDate(closes.getDate() + 7)
    return { opens: dateValue(opens), closes: dateValue(closes) }
  })
  const [state, formAction, pending] = useActionState(
    createFeedbackSchedule,
    initialState
  )
  useActionToast(state)

  const activeDepartment = departments.find(
    (department) => department.id === departmentId
  )
  const semesters = useMemo(
    () =>
      (activeDepartment?.semesters ?? []).filter(
        (semester) =>
          semester.academicYearId === academicYearId &&
          semester.divisions.length > 0
      ),
    [activeDepartment, academicYearId]
  )
  const selectedGroups = semesters.flatMap((semester) =>
    semester.divisions
      .filter((division) =>
        selectedKeys.includes(groupKey(semester.id, division.id))
      )
      .map((division) => ({ semester, division }))
  )
  const selectedCount = selectedGroups.length
  const allocationCount = selectedGroups.reduce(
    (total, group) => total + group.division.allocationCount,
    0
  )
  const selectedStudents = selectedGroups.reduce(
    (total, group) => total + group.division.studentCount,
    0
  )

  function updateAcademicYear(value: string | null) {
    setAcademicYearId(value ?? "")
    setDepartmentId("")
    setSelectedKeys([])
  }

  function updateDepartment(value: string | null) {
    setDepartmentId(value ?? "")
    setSelectedKeys([])
  }

  function toggleDivision(semesterId: string, divisionId: string) {
    const key = groupKey(semesterId, divisionId)
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((currentKey) => currentKey !== key)
        : [...current, key]
    )
  }

  function toggleAll(semester: Semester) {
    const eligibleKeys = semester.divisions
      .filter((division) => division.allocationCount > 0)
      .map((division) => groupKey(semester.id, division.id))
    const allChecked =
      eligibleKeys.length > 0 &&
      eligibleKeys.every((key) => selectedKeys.includes(key))
    setSelectedKeys((current) =>
      allChecked
        ? current.filter((key) => !eligibleKeys.includes(key))
        : [...new Set([...current, ...eligibleKeys])]
    )
  }

  return (
    <form id="feedback-schedule-form" action={formAction} className="space-y-5">
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <input type="hidden" name="departmentId" value={departmentId} />
      <input
        type="hidden"
        name="selections"
        value={JSON.stringify(
          selectedGroups.map((group) => ({
            semesterId: group.semester.id,
            divisionId: group.division.id,
          }))
        )}
      />

      {state.error ? (
        <Alert variant="destructive">
          <WarningCircleIcon weight="fill" />
          <AlertTitle>Schedule could not be created</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <CheckCircleIcon weight="fill" />
          <AlertTitle>{state.success}</AlertTitle>
          <AlertDescription>
            {state.result
              ? `${state.result.alreadyScheduled} already scheduled · ${state.result.withoutAllocations} without eligible allocations`
              : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="border-b bg-muted/25 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Schedule settings</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose where the feedback cycle applies and when it opens.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit">
                Drafts only · no emails yet
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <FieldGroup
              label="Academic year"
              error={state.fieldErrors?.academicYearId?.[0]}
            >
              <Select
                value={academicYearId}
                onValueChange={updateAcademicYear}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((academicYear) => (
                    <SelectItem key={academicYear.id} value={academicYear.id}>
                      {academicYear.yearString}
                      {academicYear.isActive ? " · Active" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup
              label="Department"
              error={state.fieldErrors?.departmentId?.[0]}
            >
              <Select
                value={departmentId}
                onValueChange={updateDepartment}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name} · {department.abbreviation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Feedback opens">
              <Input
                name="scheduleStart"
                type="date"
                defaultValue={dateDefaults.opens}
                required
              />
            </FieldGroup>
            <FieldGroup
              label="Feedback closes"
              error={state.fieldErrors?.scheduleEnd?.[0]}
            >
              <Input
                name="scheduleEnd"
                type="date"
                defaultValue={dateDefaults.closes}
                required
              />
            </FieldGroup>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardTextIcon
                    className="size-4 text-primary"
                    weight="fill"
                  />
                  <p className="font-medium">Teaching groups</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select every division that should receive a draft form.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                {selectedCount} selected
              </Badge>
            </div>

            {!activeDepartment ? (
              <ScheduleEmptyState message="Choose a department to load the semesters and divisions available for feedback." />
            ) : semesters.length === 0 ? (
              <ScheduleEmptyState message="No divisions are available in this department for the selected academic year." />
            ) : (
              <div className="divide-y">
                {semesters.map((semester) => {
                  const eligibleDivisions = semester.divisions.filter(
                    (division) => division.allocationCount > 0
                  )
                  const selectedForSemester = eligibleDivisions.filter(
                    (division) =>
                      selectedKeys.includes(groupKey(semester.id, division.id))
                  ).length
                  const allChecked =
                    eligibleDivisions.length > 0 &&
                    selectedForSemester === eligibleDivisions.length
                  return (
                    <section key={semester.id} className="p-5 sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                            {semester.semesterNumber}
                          </span>
                          <div>
                            <p className="font-medium">
                              Semester {semester.semesterNumber}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {semesterRun(semester.semesterType)} ·{" "}
                              {eligibleDivisions.length} ready division
                              {eligibleDivisions.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <Label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                          <Checkbox
                            checked={allChecked}
                            disabled={eligibleDivisions.length === 0}
                            onCheckedChange={() => toggleAll(semester)}
                          />
                          Select all ready
                        </Label>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {semester.divisions.map((division) => {
                          const checked = selectedKeys.includes(
                            groupKey(semester.id, division.id)
                          )
                          const isReady = division.allocationCount > 0
                          return (
                            <Label
                              key={division.id}
                              className="group flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 transition-[border,background,box-shadow] hover:border-primary/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:shadow-sm"
                            >
                              <Checkbox
                                checked={checked}
                                disabled={!isReady}
                                onCheckedChange={() =>
                                  toggleDivision(semester.id, division.id)
                                }
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="font-medium">
                                    Division {division.divisionName}
                                  </span>
                                  {isReady ? (
                                    <Badge variant="secondary">Ready</Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      No allocations
                                    </Badge>
                                  )}
                                </span>
                                <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-muted-foreground">
                                  <span>
                                    {division.studentCount} expected students
                                  </span>
                                  <span>
                                    {division.allocationCount} teaching
                                    allocations
                                  </span>
                                </span>
                              </span>
                            </Label>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="xl:sticky xl:top-6">
          <Card className="overflow-hidden border-primary/20 shadow-sm">
            <CardContent className="p-0">
              <div className="bg-primary px-5 py-5 text-primary-foreground">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-primary-foreground/80">
                      Schedule review
                    </p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">
                      {selectedCount}
                    </p>
                    <p className="mt-1 text-sm text-primary-foreground/85">
                      draft form{selectedCount === 1 ? "" : "s"} to create
                    </p>
                  </div>
                  <CalendarCheckIcon
                    className="size-10 text-primary-foreground/80"
                    weight="fill"
                  />
                </div>
              </div>
              <div className="space-y-5 p-5">
                <div className="space-y-3 text-sm">
                  <SummaryRow
                    icon={BuildingsIcon}
                    label="Department"
                    value={
                      activeDepartment
                        ? `${activeDepartment.name} · ${activeDepartment.abbreviation}`
                        : "Not selected"
                    }
                  />
                  <SummaryRow
                    icon={UsersThreeIcon}
                    label="Expected students"
                    value={
                      selectedStudents > 0
                        ? selectedStudents.toLocaleString("en-IN")
                        : "—"
                    }
                  />
                  <SummaryRow
                    icon={ClipboardTextIcon}
                    label="Question sources"
                    value={
                      allocationCount > 0
                        ? `${allocationCount} allocations`
                        : "—"
                    }
                  />
                  <SummaryRow
                    icon={CalendarBlankIcon}
                    label="Initial status"
                    value="Draft"
                  />
                </div>
                <div className="rounded-xl border border-dashed bg-muted/30 p-3">
                  <p className="text-xs font-medium">What happens next?</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    You can review questions, upload students, and activate each
                    draft when it is ready to send.
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={pending || selectedCount === 0}
                  onClick={() => setReviewOpen(true)}
                >
                  <CalendarCheckIcon weight="fill" />
                  Review schedule
                </Button>
                {state.fieldErrors?.selections ? (
                  <p className="text-center text-xs text-destructive">
                    {state.fieldErrors.selections[0]}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Review feedback schedule</DialogTitle>
            <DialogDescription>
              {selectedCount} draft feedback form
              {selectedCount === 1 ? "" : "s"} will be created. No invitations
              are sent at this stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {semesters.map((semester) => {
              const groups = selectedGroups.filter(
                (group) => group.semester.id === semester.id
              )
              if (groups.length === 0) return null
              return (
                <div key={semester.id} className="rounded-xl border p-4">
                  <p className="font-medium">
                    Semester {semester.semesterNumber} ·{" "}
                    {semesterRun(semester.semesterType)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {groups.map(({ division }) => (
                      <Badge key={division.id} variant="secondary">
                        Division {division.divisionName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="submit"
              form="feedback-schedule-form"
              disabled={pending}
            >
              <CalendarCheckIcon weight="fill" />
              {pending ? "Creating…" : "Create draft forms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">
        <Icon className="size-4" weight="fill" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm leading-5 font-medium">{value}</p>
      </div>
    </div>
  )
}

function ScheduleEmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center sm:px-6">
      <UsersThreeIcon className="mx-auto size-9 text-muted-foreground" />
      <p className="mt-3 font-medium">Nothing to schedule yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
