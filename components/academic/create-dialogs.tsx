"use client"

import { useActionState, useMemo, useState } from "react"
import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react"

import {
  createAcademicYear,
  createCollege,
  createDepartment,
  createDivision,
  createSemester,
  type AcademicYearActionState,
  type CollegeActionState,
  type DepartmentActionState,
  type DivisionActionState,
  type SemesterActionState,
} from "@/app/actions/academic"
import { Button } from "@/components/ui/button"
import {
  Dialog,
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

type College = { id: string; name: string }
type Department = { id: string; name: string; abbreviation: string }
type AcademicYear = { id: string; yearString: string; isActive: boolean }
type Semester = {
  id: string
  departmentId: string
  semesterNumber: number
  semesterType: "ODD" | "EVEN"
  academicYear: { yearString: string }
}

function semesterRunLabel(type: Semester["semesterType"]) {
  return type === "ODD" ? "Odd semester" : "Even semester"
}

function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error)
    return (
      <div
        role="alert"
        className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
        {error}
      </div>
    )
  if (success)
    return (
      <div
        role="status"
        className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary"
      >
        {success}
      </div>
    )
  return null
}

const emptyYearState: AcademicYearActionState = {}
export function AcademicYearCreateDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createAcademicYear,
    emptyYearState
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add year
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an academic year</DialogTitle>
          <DialogDescription>
            Optionally make it the single active academic year.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <FormMessage error={state.error} success={state.success} />
          <div className="space-y-2">
            <Label htmlFor="year-string">Academic year</Label>
            <Input
              id="year-string"
              name="yearString"
              placeholder="2026-2027"
              required
            />
            {state.fieldErrors?.yearString && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.yearString[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Availability</Label>
            <Select name="activation" defaultValue="INACTIVE" required>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Set as active year</SelectItem>
                <SelectItem value="INACTIVE">Keep inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create year"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const emptyCollegeState: CollegeActionState = {}
export function CollegeCreateDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createCollege,
    emptyCollegeState
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add college
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a college</DialogTitle>
          <DialogDescription>
            Create a college record for department ownership and institutional
            information.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <FormMessage error={state.error} success={state.success} />
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="college-name">College name</Label>
              <Input
                id="college-name"
                name="name"
                placeholder="e.g. LDRP Institute of Technology and Research"
                required
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="college-website">Website</Label>
              <Input
                id="college-website"
                name="websiteUrl"
                type="url"
                placeholder="https://college.edu"
                required
              />
              {state.fieldErrors?.websiteUrl && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.websiteUrl[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="college-address">Address</Label>
              <Input
                id="college-address"
                name="address"
                placeholder="College address"
                required
              />
              {state.fieldErrors?.address && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.address[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="college-contact">Contact number</Label>
              <Input
                id="college-contact"
                name="contactNumber"
                placeholder="e.g. +91 79 0000 0000"
                required
              />
              {state.fieldErrors?.contactNumber && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.contactNumber[0]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create college"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const emptyDepartmentState: DepartmentActionState = {}
export function DepartmentCreateDialog({ colleges }: { colleges: College[] }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createDepartment,
    emptyDepartmentState
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add department
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a department</DialogTitle>
          <DialogDescription>
            Define the department and its academic contact details.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <FormMessage error={state.error} success={state.success} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>College</Label>
              <Select name="collegeId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((college) => (
                    <SelectItem key={college.id} value={college.id}>
                      {college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.collegeId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.collegeId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="department-name">Department name</Label>
              <Input
                id="department-name"
                name="name"
                placeholder="e.g. Computer Engineering"
                required
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department-abbreviation">Abbreviation</Label>
              <Input
                id="department-abbreviation"
                name="abbreviation"
                placeholder="e.g. CE"
                required
              />
              {state.fieldErrors?.abbreviation && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.abbreviation[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hod-name">HOD name</Label>
              <Input
                id="hod-name"
                name="hodName"
                placeholder="e.g. Dr. A. Shah"
                required
              />
              {state.fieldErrors?.hodName && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.hodName[0]}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hod-email">HOD email</Label>
              <Input
                id="hod-email"
                name="hodEmail"
                type="email"
                placeholder="hod@college.edu"
                required
              />
              {state.fieldErrors?.hodEmail && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.hodEmail[0]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const emptySemesterState: SemesterActionState = {}
export function SemesterCreateDialog({
  departments,
  academicYears,
}: {
  departments: Department[]
  academicYears: AcademicYear[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createSemester,
    emptySemesterState
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add semester
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a semester</DialogTitle>
          <DialogDescription>
            Configure a department semester for a specific academic year.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <FormMessage error={state.error} success={state.success} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select name="departmentId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name} ({department.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.departmentId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.departmentId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Academic year</Label>
              <Select
                name="academicYearId"
                defaultValue={academicYears.find((year) => year.isActive)?.id}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.yearString}
                      {year.isActive ? " · Active" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.academicYearId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.academicYearId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Semester number</Label>
              <Select name="semesterNumber" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose number" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (number) => (
                      <SelectItem key={number} value={String(number)}>
                        Semester {number}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {state.fieldErrors?.semesterNumber && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.semesterNumber[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Semester run</Label>
              <Select name="semesterType" defaultValue="ODD" required>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ODD">Odd semester</SelectItem>
                  <SelectItem value="EVEN">Even semester</SelectItem>
                </SelectContent>
              </Select>
              {state.fieldErrors?.semesterType && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.semesterType[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester-start">
                Start date{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="semester-start" name="startDate" type="date" />
              {state.fieldErrors?.startDate && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.startDate[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester-end">
                End date{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="semester-end" name="endDate" type="date" />
              {state.fieldErrors?.endDate && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.endDate[0]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create semester"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const emptyDivisionState: DivisionActionState = {}
export function DivisionCreateDialog({
  departments,
  semesters,
}: {
  departments: Department[]
  semesters: Semester[]
}) {
  const [open, setOpen] = useState(false)
  const [departmentId, setDepartmentId] = useState("")
  const [state, formAction, pending] = useActionState(
    createDivision,
    emptyDivisionState
  )
  const availableSemesters = useMemo(
    () =>
      semesters.filter((semester) => semester.departmentId === departmentId),
    [departmentId, semesters]
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add division
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a division</DialogTitle>
          <DialogDescription>
            Create a division in one configured department semester.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <FormMessage error={state.error} success={state.success} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                name="departmentId"
                value={departmentId}
                onValueChange={(value) => setDepartmentId(value ?? "")}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name} ({department.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.departmentId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.departmentId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select name="semesterId" disabled={!departmentId} required>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      departmentId
                        ? "Choose semester"
                        : "Choose department first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      Semester {semester.semesterNumber} ·{" "}
                      {semesterRunLabel(semester.semesterType)} ·{" "}
                      {semester.academicYear.yearString}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.semesterId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.semesterId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="division-name">Division name</Label>
              <Input
                id="division-name"
                name="divisionName"
                placeholder="e.g. A"
                required
              />
              {state.fieldErrors?.divisionName && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.divisionName[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="division-student-count">
                Expected student count
              </Label>
              <Input
                id="division-student-count"
                name="studentCount"
                type="number"
                min="0"
                placeholder="e.g. 60"
                required
              />
              {state.fieldErrors?.studentCount && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.studentCount[0]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create division"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
