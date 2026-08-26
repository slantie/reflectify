"use client"

import { useActionState, useState } from "react"
import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react"

import { createSubject, type SubjectActionState } from "@/app/actions/subjects"
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
type Semester = {
  id: string
  departmentId: string
  semesterNumber: number
  semesterType: "ODD" | "EVEN"
  academicYear: { yearString: string }
}

const initialState: SubjectActionState = {}

function semesterRunLabel(type: Semester["semesterType"]) {
  return type === "ODD" ? "Odd semester" : "Even semester"
}

export function SubjectCreateDialog({
  departments,
  semesters,
}: {
  departments: Department[]
  semesters: Semester[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createSubject,
    initialState
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add subject
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a subject</DialogTitle>
          <DialogDescription>
            Create a subject in the selected department and academic semester.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subject-name">Subject name</Label>
              <Input
                id="subject-name"
                name="name"
                placeholder="e.g. Data Structures"
                required
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-code">Subject code</Label>
              <Input
                id="subject-code"
                name="subjectCode"
                placeholder="e.g. CE301"
                required
              />
              {state.fieldErrors?.subjectCode && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.subjectCode[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-abbreviation">Abbreviation</Label>
              <Input
                id="subject-abbreviation"
                name="abbreviation"
                placeholder="e.g. DS"
                required
              />
              {state.fieldErrors?.abbreviation && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.abbreviation[0]}
                </p>
              )}
            </div>
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
              <Label>Semester</Label>
              <Select name="semesterId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
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
            <div className="space-y-2 sm:col-span-2">
              <Label>Subject type</Label>
              <Select name="type" defaultValue="MANDATORY" required>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANDATORY">Mandatory</SelectItem>
                  <SelectItem value="ELECTIVE">Elective</SelectItem>
                </SelectContent>
              </Select>
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
              {pending ? "Creating…" : "Create subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
