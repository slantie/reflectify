"use client"

import { useActionState, useState } from "react"
import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react"

import { createFaculty, type FacultyActionState } from "@/app/actions/faculties"
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

const initialState: FacultyActionState = {}

export function FacultyCreateDialog({
  departments,
}: {
  departments: Department[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createFaculty,
    initialState
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon weight="bold" /> Add faculty
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a faculty member</DialogTitle>
          <DialogDescription>
            Create a profile used for allocations, feedback forms, and
            reporting.
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="faculty-name">Full name</Label>
              <Input
                id="faculty-name"
                name="name"
                placeholder="e.g. Dr. Priya Shah"
                required
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-email">Institutional email</Label>
              <Input
                id="faculty-email"
                name="email"
                type="email"
                placeholder="priya@college.edu"
                required
              />
              {state.fieldErrors?.email && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-abbreviation">
                Abbreviation{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="faculty-abbreviation"
                name="abbreviation"
                placeholder="e.g. PS"
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
              <Label>Designation</Label>
              <Select name="designation" defaultValue="AsstProf" required>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOD">Head of department</SelectItem>
                  <SelectItem value="AsstProf">Assistant professor</SelectItem>
                  <SelectItem value="LabAsst">Lab assistant</SelectItem>
                </SelectContent>
              </Select>
              {state.fieldErrors?.designation && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.designation[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-location">Seating location</Label>
              <Input
                id="faculty-location"
                name="seatingLocation"
                placeholder="e.g. Block A · 304"
                required
              />
              {state.fieldErrors?.seatingLocation && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.seatingLocation[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-joining-date">Joining date</Label>
              <Input
                id="faculty-joining-date"
                name="joiningDate"
                type="date"
                required
              />
              {state.fieldErrors?.joiningDate && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.joiningDate[0]}
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
              {pending ? "Creating…" : "Create faculty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
