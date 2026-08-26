"use client"

import { useActionState, useState } from "react"
import {
  DownloadSimpleIcon,
  FileXlsIcon,
  FileArrowUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { useDropzone } from "react-dropzone"

import {
  previewFacultyMatrix,
  type MatrixPreviewState,
} from "@/app/actions/uploads"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { referenceFiles } from "@/lib/upload/reference-files"

type AcademicYear = { id: string; yearString: string; isActive: boolean }
type Department = { id: string; name: string; abbreviation: string }

const initialState: MatrixPreviewState = {}

export function FacultyMatrixUpload({
  academicYears,
  departments,
}: {
  academicYears: AcademicYear[]
  departments: Department[]
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState(
    previewFacultyMatrix,
    initialState
  )
  const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropAccepted: (files) => setFileName(files[0]?.name ?? null),
    onDropRejected: () => setFileName(null),
  })

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          render={
            <a
              href={referenceFiles.facultyMatrix}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <DownloadSimpleIcon /> Download format
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
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
          <Label>Semester run</Label>
          <Select name="semesterRun" required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Odd or even" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ODD">Odd semester</SelectItem>
              <SelectItem value="EVEN">Even semester</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.semesterRun && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.semesterRun[0]}
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
      </div>
      <div
        {...getRootProps()}
        className={`rounded-xl border border-dashed p-6 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/60 hover:bg-primary/5"}`}
      >
        <Input
          {...getInputProps({ name: "facultyMatrix" })}
          className="sr-only"
        />
        <FileXlsIcon className="mx-auto size-9 text-primary" weight="duotone" />
        <p className="mt-3 font-medium">
          {isDragActive
            ? "Drop the .xlsx Faculty Matrix here"
            : "Drop your Faculty Matrix here"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          .xlsx only · maximum 10 MB
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          <FileArrowUpIcon /> Browse file
        </Button>
        {fileName && (
          <p className="mt-3 truncate text-sm text-primary">
            Selected: {fileName}
          </p>
        )}
      </div>
      {state.error && (
        <Alert variant="destructive">
          <WarningCircleIcon weight="fill" />
          <AlertTitle>Matrix could not be analysed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <FileXlsIcon weight="fill" />
          <AlertTitle>{state.success}</AlertTitle>
          <AlertDescription>
            Nothing has been written to the database yet.
          </AlertDescription>
        </Alert>
      )}
      {state.summary && (
        <div className="grid gap-3 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {state.summary.divisions}
            </p>
            <p className="text-sm text-muted-foreground">
              division timetables found
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {state.summary.timetableEntries}
            </p>
            <p className="text-sm text-muted-foreground">
              schedule entries parsed
            </p>
          </div>
          {state.summary.warnings.length > 0 && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-medium">Parser notes</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {state.summary.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Analysing matrix…" : "Analyse Faculty Matrix"}
      </Button>
    </form>
  )
}
