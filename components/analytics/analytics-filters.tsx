"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FunnelSimpleIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type Option = {
  id: string
  label: string
  departmentId?: string
  semesterId?: string
  academicYearId?: string
}

export function AnalyticsFilters({
  years,
  departments,
  semesters,
  divisions,
  subjects,
  values,
}: {
  years: Option[]
  departments: Option[]
  semesters: Option[]
  divisions: Option[]
  subjects: Option[]
  values: {
    year?: string
    department?: string
    semester?: string
    division?: string
    subject?: string
    teaching?: "all" | "lecture" | "lab"
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const selectedYear = values.year ?? "all"
  const selectedDepartment = values.department ?? "all"
  const selectedSemester = values.semester ?? "all"
  const selectedDivision = values.division ?? "all"
  const selectedSubject = values.subject ?? "all"
  const selectedTeaching = values.teaching ?? "all"
  const activeFilterCount = [
    values.department,
    values.semester,
    values.division,
    values.subject,
    values.teaching !== "all" ? values.teaching : undefined,
  ].filter(Boolean).length
  const visibleSemesters = semesters.filter(
    (semester) =>
      (selectedYear === "all" || semester.academicYearId === selectedYear) &&
      (selectedDepartment === "all" ||
        semester.departmentId === selectedDepartment)
  )
  const visibleDivisions = divisions.filter(
    (division) =>
      (selectedSemester === "all" ||
        division.semesterId === selectedSemester) &&
      (selectedDepartment === "all" ||
        division.departmentId === selectedDepartment)
  )
  const visibleSubjects = subjects.filter(
    (subject) =>
      (selectedDepartment === "all" ||
        subject.departmentId === selectedDepartment) &&
      (selectedSemester === "all" || subject.semesterId === selectedSemester)
  )

  function updateFilter(name: string, value: string, reset: string[] = []) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") params.delete(name)
    else params.set(name, value)
    reset.forEach((key) => params.delete(key))
    const query = params.toString()
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname)
    )
  }

  function clearFilters() {
    startTransition(() => router.replace(pathname))
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
          />
        }
      >
        <FunnelSimpleIcon className="size-4" weight="fill" />
        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(26rem,100vw)] overflow-y-auto p-0"
      >
        <SheetHeader className="border-b px-5 py-5">
          <SheetTitle className="flex items-center gap-2">
            <FunnelSimpleIcon className="size-4 text-primary" weight="fill" />
            Refine analytics
          </SheetTitle>
          <SheetDescription>
            Limit the dashboard to an academic group, subject, or teaching type.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">
              {activeFilterCount > 0
                ? `${activeFilterCount} additional filter${activeFilterCount === 1 ? "" : "s"} active`
                : "Showing the current academic scope"}
            </span>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="grid gap-4">
            <FilterSelect
              label="Academic year"
              value={selectedYear}
              options={years}
              allLabel="All academic years"
              disabled={pending}
              onValueChange={(value) =>
                updateFilter("year", value, ["semester", "division", "subject"])
              }
            />
            <FilterSelect
              label="Department"
              value={selectedDepartment}
              options={departments}
              allLabel="All departments"
              disabled={pending}
              onValueChange={(value) =>
                updateFilter("department", value, [
                  "semester",
                  "division",
                  "subject",
                ])
              }
            />
            <FilterSelect
              label="Semester"
              value={selectedSemester}
              options={visibleSemesters}
              allLabel="All semesters"
              disabled={pending}
              onValueChange={(value) =>
                updateFilter("semester", value, ["division", "subject"])
              }
            />
            <FilterSelect
              label="Division"
              value={selectedDivision}
              options={visibleDivisions}
              allLabel="All divisions"
              disabled={pending}
              onValueChange={(value) => updateFilter("division", value)}
            />
            <FilterSelect
              label="Subject"
              value={selectedSubject}
              options={visibleSubjects}
              allLabel="All subjects"
              disabled={pending}
              onValueChange={(value) => updateFilter("subject", value)}
            />
            <FilterSelect
              label="Teaching type"
              value={selectedTeaching}
              options={[
                { id: "lecture", label: "Lecture feedback" },
                { id: "lab", label: "Lab feedback" },
              ]}
              allLabel="Lecture and lab"
              disabled={pending}
              onValueChange={(value) => updateFilter("teaching", value)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  disabled,
  onValueChange,
}: {
  label: string
  value: string
  options: Option[]
  allLabel: string
  disabled: boolean
  onValueChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => onValueChange(next ?? "all")}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
