"use client"

import { Fragment, useMemo, useState } from "react"
import {
  BookOpenIcon,
  CalendarDotsIcon,
  CoffeeIcon,
  GraduationCapIcon,
  UserListIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

const SLOT_TIMES: Record<number, string> = {
  1: "09:00 – 09:55",
  2: "09:55 – 10:50",
  3: "11:00 – 11:55",
  4: "11:55 – 12:50",
  5: "13:20 – 14:15",
  6: "14:15 – 15:10",
}

type ScheduleEntry = {
  subject: string
  faculty: string
  type: string
  batch: string
  day: (typeof DAYS)[number]
  slot: string
}

export type ScheduleDivision = {
  id: string
  name: string
  studentCount: number
  department: { id: string; name: string; abbreviation: string }
  semester: {
    id: string
    number: number
    type: string
    academicYear: { id: string; yearString: string; isActive: boolean }
  }
  entries: readonly unknown[]
}

export type ScheduleFaculty = {
  name: string
  abbreviation: string | null
  designation: string
}

type Mode = "class" | "faculty"

function parseEntries(entries: readonly unknown[]): ScheduleEntry[] {
  return entries.flatMap((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return []

    const entry = value as Record<string, unknown>
    const day = typeof entry.Day === "string" ? entry.Day.trim() : ""
    const slot = String(entry.Time_Slot ?? "").trim()
    if (
      !DAYS.includes(day as (typeof DAYS)[number]) ||
      !/^\d+(?:-\d+)?$/.test(slot)
    ) {
      return []
    }

    return [
      {
        subject:
          String(entry.Subject ?? "Untitled subject").trim() ||
          "Untitled subject",
        faculty: String(entry.Faculty ?? "Unassigned").trim() || "Unassigned",
        type: String(entry.Type ?? "Class").trim() || "Class",
        batch: String(entry.Batch ?? "-").trim() || "-",
        day: day as (typeof DAYS)[number],
        slot,
      },
    ]
  })
}

function startsAt(slot: string) {
  return Number.parseInt(slot.split("-")[0] ?? "", 10)
}

function occursInSlot(entry: ScheduleEntry, slot: number) {
  const [start, end] = entry.slot.split("-").map(Number)
  return Number.isFinite(start) && slot >= start && slot <= (end || start)
}

function entryTone(type: string) {
  switch (type.toLowerCase()) {
    case "lab":
      return "border-primary/25 bg-primary/10 text-primary"
    case "tutorial":
      return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
    case "library":
      return "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300"
    case "project":
      return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
    default:
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
  }
}

function semesterLabel(semester: ScheduleDivision["semester"]) {
  return `Semester ${semester.number} · ${semester.type === "ODD" ? "Odd" : "Even"}`
}

export function TimetableWorkspace({
  divisions,
  faculties,
}: {
  divisions: ScheduleDivision[]
  faculties: ScheduleFaculty[]
}) {
  const [mode, setMode] = useState<Mode>("class")
  const activeYear = divisions.find(
    (division) => division.semester.academicYear.isActive
  )?.semester.academicYear
  const [academicYearId, setAcademicYearId] = useState(activeYear?.id ?? "")
  const [departmentId, setDepartmentId] = useState("")
  const [semesterId, setSemesterId] = useState("")
  const [divisionId, setDivisionId] = useState("")
  const [facultyCode, setFacultyCode] = useState("")
  const [mobileDay, setMobileDay] = useState<(typeof DAYS)[number]>("Monday")

  const parsedDivisions = useMemo(
    () =>
      divisions.map((division) => ({
        ...division,
        timetable: parseEntries(division.entries),
      })),
    [divisions]
  )
  const academicYears = useMemo(
    () =>
      Array.from(
        new Map(
          parsedDivisions.map((division) => [
            division.semester.academicYear.id,
            division.semester.academicYear,
          ])
        ).values()
      ).sort((left, right) => right.yearString.localeCompare(left.yearString)),
    [parsedDivisions]
  )
  const departments = useMemo(
    () =>
      Array.from(
        new Map(
          parsedDivisions
            .filter(
              (division) => division.semester.academicYear.id === academicYearId
            )
            .map((division) => [division.department.id, division.department])
        ).values()
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [academicYearId, parsedDivisions]
  )
  const semesters = useMemo(
    () =>
      Array.from(
        new Map(
          parsedDivisions
            .filter(
              (division) =>
                division.semester.academicYear.id === academicYearId &&
                division.department.id === departmentId
            )
            .map((division) => [division.semester.id, division.semester])
        ).values()
      ).sort((left, right) => left.number - right.number),
    [academicYearId, departmentId, parsedDivisions]
  )
  const availableDivisions = useMemo(
    () =>
      parsedDivisions
        .filter(
          (division) =>
            division.semester.academicYear.id === academicYearId &&
            division.department.id === departmentId &&
            division.semester.id === semesterId
        )
        .sort((left, right) => left.name.localeCompare(right.name)),
    [academicYearId, departmentId, parsedDivisions, semesterId]
  )
  const selectedDivision = parsedDivisions.find(
    (division) => division.id === divisionId
  )
  const facultyOptions = useMemo(() => {
    const namesByCode = new Map(
      faculties
        .filter((faculty) => faculty.abbreviation)
        .map((faculty) => [
          faculty.abbreviation?.trim().toUpperCase() ?? "",
          faculty,
        ])
    )
    const codes = new Set(
      parsedDivisions.flatMap((division) =>
        division.timetable.map((entry) => entry.faculty.trim())
      )
    )

    return [...codes]
      .filter(Boolean)
      .map((code) => {
        const faculty = namesByCode.get(code.toUpperCase())
        return {
          code,
          label: faculty ? `${faculty.name} · ${faculty.abbreviation}` : code,
          detail: faculty?.designation ?? "Faculty member",
        }
      })
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [faculties, parsedDivisions])
  const selectedFaculty = facultyOptions.find(
    (faculty) => faculty.code === facultyCode
  )
  const facultySessions = useMemo(
    () =>
      parsedDivisions.flatMap((division) =>
        division.timetable
          .filter(
            (entry) =>
              entry.faculty.trim().toUpperCase() ===
              facultyCode.trim().toUpperCase()
          )
          .map((entry) => ({ entry, division }))
      ),
    [facultyCode, parsedDivisions]
  )

  function chooseYear(value: string | null) {
    setAcademicYearId(value ?? "")
    setDepartmentId("")
    setSemesterId("")
    setDivisionId("")
  }

  function chooseDepartment(value: string | null) {
    setDepartmentId(value ?? "")
    setSemesterId("")
    setDivisionId("")
  }

  function chooseSemester(value: string | null) {
    setSemesterId(value ?? "")
    setDivisionId("")
  }

  const sessions =
    mode === "class"
      ? (selectedDivision?.timetable ?? [])
      : facultySessions.map(({ entry }) => entry)
  const scheduleTitle =
    mode === "class"
      ? selectedDivision
        ? `Division ${selectedDivision.name}`
        : "Class timetable"
      : (selectedFaculty?.label ?? "Faculty timetable")
  const scheduleDescription =
    mode === "class" && selectedDivision
      ? `${selectedDivision.department.name} · ${semesterLabel(selectedDivision.semester)} · ${selectedDivision.studentCount} students`
      : mode === "faculty" && selectedFaculty
        ? `${selectedFaculty.detail} · ${new Set(facultySessions.map((session) => session.division.id)).size} class groups`
        : "Select a timetable to begin"

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b bg-muted/25 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-medium">View a timetable</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch between a class schedule and a faculty member’s teaching
                week.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:w-auto">
              <Button
                type="button"
                size="sm"
                variant={mode === "class" ? "default" : "ghost"}
                className="w-full"
                onClick={() => setMode("class")}
              >
                <GraduationCapIcon
                  weight={mode === "class" ? "fill" : "regular"}
                />
                By class
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "faculty" ? "default" : "ghost"}
                className="w-full"
                onClick={() => setMode("faculty")}
              >
                <UsersThreeIcon
                  weight={mode === "faculty" ? "fill" : "regular"}
                />
                By faculty
              </Button>
            </div>
          </div>

          {mode === "class" ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
              <ScheduleSelect
                label="Academic year"
                value={academicYearId}
                onValueChange={chooseYear}
                placeholder="Choose academic year"
                options={academicYears.map((year) => ({
                  value: year.id,
                  label: `${year.yearString}${year.isActive ? " · Active" : ""}`,
                }))}
              />
              <ScheduleSelect
                label="Department"
                value={departmentId}
                onValueChange={chooseDepartment}
                placeholder={
                  academicYearId ? "Choose department" : "Select year first"
                }
                disabled={!academicYearId}
                options={departments.map((department) => ({
                  value: department.id,
                  label: `${department.name} · ${department.abbreviation}`,
                }))}
              />
              <ScheduleSelect
                label="Semester"
                value={semesterId}
                onValueChange={chooseSemester}
                placeholder={
                  departmentId ? "Choose semester" : "Select department first"
                }
                disabled={!departmentId}
                options={semesters.map((semester) => ({
                  value: semester.id,
                  label: semesterLabel(semester),
                }))}
              />
              <ScheduleSelect
                label="Division"
                value={divisionId}
                onValueChange={(value) => setDivisionId(value ?? "")}
                placeholder={
                  semesterId ? "Choose division" : "Select semester first"
                }
                disabled={!semesterId}
                options={availableDivisions.map((division) => ({
                  value: division.id,
                  label: `Division ${division.name} · ${division.studentCount} students`,
                }))}
              />
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,26rem)_1fr] md:items-end">
              <ScheduleSelect
                label="Faculty member"
                value={facultyCode}
                onValueChange={(value) => setFacultyCode(value ?? "")}
                placeholder="Choose a faculty member"
                options={facultyOptions.map((faculty) => ({
                  value: faculty.code,
                  label: faculty.label,
                }))}
              />
              <p className="pb-1 text-sm leading-6 text-muted-foreground">
                The timetable combines every class where the selected faculty
                member is scheduled to teach.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {sessions.length > 0 ? (
        <TimetableGrid
          entries={sessions}
          title={scheduleTitle}
          description={scheduleDescription}
          mobileDay={mobileDay}
          onMobileDayChange={setMobileDay}
          facultyMode={mode === "faculty"}
          sessions={facultySessions}
        />
      ) : (
        <ScheduleEmptyState
          mode={mode}
          hasSelection={Boolean(divisionId || facultyCode)}
        />
      )}
    </div>
  )
}

function ScheduleSelect({
  label,
  value,
  onValueChange,
  placeholder,
  options,
  disabled = false,
}: {
  label: string
  value: string
  onValueChange: (value: string | null) => void
  placeholder: string
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function TimetableGrid({
  entries,
  title,
  description,
  mobileDay,
  onMobileDayChange,
  facultyMode,
  sessions,
}: {
  entries: ScheduleEntry[]
  title: string
  description: string
  mobileDay: (typeof DAYS)[number]
  onMobileDayChange: (day: (typeof DAYS)[number]) => void
  facultyMode: boolean
  sessions: Array<{ entry: ScheduleEntry; division: ScheduleDivision }>
}) {
  const sessionsBySlot = (day: (typeof DAYS)[number], slot: number) =>
    entries
      .filter((entry) => entry.day === day && occursInSlot(entry, slot))
      .sort((left, right) => startsAt(left.slot) - startsAt(right.slot))
  const classForEntry = (entry: ScheduleEntry) =>
    facultyMode
      ? sessions.find((session) => session.entry === entry)?.division.name
      : undefined
  const labCount = entries.filter(
    (entry) => entry.type.toLowerCase() === "lab"
  ).length

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-primary/8 via-primary/4 to-transparent">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDotsIcon className="size-5" weight="fill" />
          </div>
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
        <div className="col-start-1 flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary">{entries.length} scheduled sessions</Badge>
          <Badge variant="outline">{labCount} lab sessions</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[980px] p-4">
            <div className="grid grid-cols-[7.25rem_repeat(6,minmax(8.5rem,1fr))] gap-2">
              <div className="flex items-center px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Time
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="rounded-lg bg-muted px-3 py-2.5 text-center text-sm font-medium"
                >
                  {day}
                </div>
              ))}
              {[1, 2, 3, 4, 5, 6].map((slot) => (
                <Fragment key={slot}>
                  {slot === 3 ? <BreakBanner label="Short break" /> : null}
                  {slot === 5 ? <BreakBanner label="Lunch break" /> : null}
                  <div className="flex min-h-28 flex-col justify-center rounded-lg border bg-muted/30 px-3">
                    <span className="text-sm font-semibold">Period {slot}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {SLOT_TIMES[slot]}
                    </span>
                  </div>
                  {DAYS.map((day) => (
                    <ScheduleCell
                      key={`${day}-${slot}`}
                      entries={sessionsBySlot(day, slot)}
                      getClass={classForEntry}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 lg:hidden">
          <div className="-mx-1 mb-4 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            {DAYS.map((day) => (
              <Button
                key={day}
                type="button"
                size="sm"
                variant={mobileDay === day ? "default" : "outline"}
                className="shrink-0 snap-start"
                onClick={() => onMobileDayChange(day)}
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((slot) => {
              const slotEntries = sessionsBySlot(mobileDay, slot)
              return (
                <Fragment key={slot}>
                  {slot === 3 ? (
                    <MobileBreak label="Short break · 10 minutes" />
                  ) : null}
                  {slot === 5 ? (
                    <MobileBreak label="Lunch break · 30 minutes" />
                  ) : null}
                  <div className="rounded-xl border bg-card p-3.5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Period {slot}</p>
                      <p className="text-xs text-muted-foreground">
                        {SLOT_TIMES[slot]}
                      </p>
                    </div>
                    {slotEntries.length ? (
                      <div className="space-y-2">
                        {slotEntries.map((entry, index) => (
                          <ScheduleEntryCard
                            key={`${entry.subject}-${entry.faculty}-${entry.batch}-${index}`}
                            entry={entry}
                            className={classForEntry(entry)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="py-1 text-sm text-muted-foreground">
                        No class scheduled
                      </p>
                    )}
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t bg-muted/25 px-5 py-3 text-xs text-muted-foreground">
          <Legend color="bg-emerald-500/70" label="Lecture" />
          <Legend color="bg-primary/70" label="Lab" />
          <Legend color="bg-sky-500/70" label="Tutorial" />
          <Legend color="bg-violet-500/70" label="Library" />
          <Legend color="bg-amber-500/70" label="Project" />
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleCell({
  entries,
  getClass,
}: {
  entries: ScheduleEntry[]
  getClass: (entry: ScheduleEntry) => string | undefined
}) {
  return (
    <div className="min-h-28 rounded-lg border bg-card p-1.5">
      {entries.length ? (
        <div className="space-y-1.5">
          {entries.map((entry, index) => (
            <ScheduleEntryCard
              key={`${entry.subject}-${entry.faculty}-${entry.batch}-${index}`}
              entry={entry}
              className={getClass(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-full min-h-24 items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      )}
    </div>
  )
}

function ScheduleEntryCard({
  entry,
  className,
}: {
  entry: ScheduleEntry
  className?: string
}) {
  const isLab = entry.type.toLowerCase() === "lab"
  return (
    <div className={cn("rounded-md border px-2 py-1.5", entryTone(entry.type))}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold">
          {entry.subject}
        </p>
        <span className="shrink-0 text-[10px] font-medium uppercase">
          {entry.type}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[11px] opacity-80">{entry.faculty}</p>
      <p className="mt-0.5 text-[10px] opacity-75">
        {isLab && entry.batch !== "-" ? `Batch ${entry.batch} · ` : ""}
        {className
          ? `Division ${className}`
          : entry.slot.includes("-")
            ? `Periods ${entry.slot}`
            : ""}
      </p>
    </div>
  )
}

function BreakBanner({ label }: { label: string }) {
  return (
    <div className="col-span-7 flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
      <CoffeeIcon className="size-3.5" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function MobileBreak({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
      <CoffeeIcon className="size-3.5" />
      {label}
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", color)} />
      {label}
    </span>
  )
}

function ScheduleEmptyState({
  mode,
  hasSelection,
}: {
  mode: Mode
  hasSelection: boolean
}) {
  const Icon = mode === "class" ? GraduationCapIcon : UserListIcon
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center px-5 py-10 text-center sm:py-12">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
        <h2 className="mt-4 font-medium">
          {hasSelection
            ? "No timetable entries found"
            : "Choose a timetable to view"}
        </h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {hasSelection
            ? "This selection does not have timetable entries yet. Upload the Faculty Matrix to publish the teaching schedule."
            : mode === "class"
              ? "Choose an academic year, department, semester, and division to see its weekly timetable."
              : "Choose a faculty member to see every class they are scheduled to teach this week."}
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpenIcon className="size-4 text-primary" weight="fill" />
          Timetables are generated from the Faculty Matrix.
        </div>
      </CardContent>
    </Card>
  )
}
