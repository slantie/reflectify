"use client"

import { useActionState, useMemo, useState } from "react"
import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react"

import {
  createAllocation,
  type AllocationActionState,
} from "@/app/actions/allocations"
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

type Department = { id: string; name: string; abbreviation: string }
type AcademicYear = { id: string; yearString: string; isActive: boolean }
type Semester = {
  id: string
  departmentId: string
  academicYearId: string
  semesterNumber: number
  semesterType: "ODD" | "EVEN"
}
type Division = {
  id: string
  departmentId: string
  semesterId: string
  divisionName: string
}
type Subject = {
  id: string
  departmentId: string
  semesterId: string
  name: string
  subjectCode: string
}
type Faculty = {
  id: string
  departmentId: string
  name: string
  abbreviation: string | null
}

function semesterRunLabel(type: "ODD" | "EVEN") {
  return type === "ODD" ? "Odd semester" : "Even semester"
}

const initialState: AllocationActionState = {}

export function AllocationCreateDialog({
  departments,
  academicYears,
  semesters,
  divisions,
  subjects,
  faculties,
}: {
  departments: Department[]
  academicYears: AcademicYear[]
  semesters: Semester[]
  divisions: Division[]
  subjects: Subject[]
  faculties: Faculty[]
}) {
  const [open, setOpen] = useState(false)
  const [departmentId, setDepartmentId] = useState("")
  const [academicYearId, setAcademicYearId] = useState(
    academicYears.find((year) => year.isActive)?.id ?? ""
  )
  const [semesterId, setSemesterId] = useState("")
  const [state, formAction, pending] = useActionState(
    createAllocation,
    initialState
  )

  const availableSemesters = useMemo(
    () =>
      semesters.filter(
        (semester) =>
          semester.departmentId === departmentId &&
          semester.academicYearId === academicYearId
      ),
    [academicYearId, departmentId, semesters]
  )
  const availableSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          subject.departmentId === departmentId &&
          subject.semesterId === semesterId
      ),
    [departmentId, semesterId, subjects]
  )
  const availableDivisions = useMemo(
    () =>
      divisions.filter(
        (division) =>
          division.departmentId === departmentId &&
          division.semesterId === semesterId
      ),
    [departmentId, semesterId, divisions]
  )
  const availableFaculty = useMemo(
    () => faculties.filter((faculty) => faculty.departmentId === departmentId),
    [departmentId, faculties]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add allocation
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a teaching allocation</DialogTitle>
          <DialogDescription>
            Connect a faculty member to a subject, division, and teaching
            activity in one academic year.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          {state.error && (
            <div
              role="alert"
              className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <WarningCircleIcon
                className="mt-0.5 size-4 shrink-0"
                weight="fill"
              />
              {state.error}
            </div>
          )}
          {state.success && (
            <div
              role="status"
              className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary"
            >
              {state.success}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Academic year</Label>
              <Select
                name="academicYearId"
                value={academicYearId}
                onValueChange={(value) => {
                  setAcademicYearId(value ?? "")
                  setSemesterId("")
                }}
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
              <Label>Department</Label>
              <Select
                name="departmentId"
                value={departmentId}
                onValueChange={(value) => {
                  setDepartmentId(value ?? "")
                  setSemesterId("")
                }}
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
              <Select
                name="semesterId"
                value={semesterId}
                onValueChange={(value) => setSemesterId(value ?? "")}
                disabled={!departmentId || !academicYearId}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      departmentId && academicYearId
                        ? "Choose semester"
                        : "Choose year and department first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      Semester {semester.semesterNumber} ·{" "}
                      {semesterRunLabel(semester.semesterType)}
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
              <Label>Faculty member</Label>
              <Select name="facultyId" disabled={!departmentId} required>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      departmentId
                        ? "Choose faculty"
                        : "Choose department first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableFaculty.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                      {faculty.abbreviation ? ` (${faculty.abbreviation})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.facultyId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.facultyId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select name="subjectId" disabled={!semesterId} required>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      semesterId ? "Choose subject" : "Choose semester first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subjectCode} · {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.subjectId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.subjectId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Division</Label>
              <Select name="divisionId" disabled={!semesterId} required>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      semesterId ? "Choose division" : "Choose semester first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDivisions.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      Division {division.divisionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.divisionId && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.divisionId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Activity type</Label>
              <Select name="lectureType" defaultValue="LECTURE" required>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LECTURE">Lecture</SelectItem>
                  <SelectItem value="LAB">Lab</SelectItem>
                  <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                  <SelectItem value="SEMINAR">Seminar</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                </SelectContent>
              </Select>
              {state.fieldErrors?.lectureType && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.lectureType[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocation-batch">
                Batch <span className="text-muted-foreground">(for labs)</span>
              </Label>
              <Input
                id="allocation-batch"
                name="batch"
                defaultValue="-"
                placeholder="e.g. 1"
              />
              {state.fieldErrors?.batch && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.batch[0]}
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
              {pending ? "Creating…" : "Create allocation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
