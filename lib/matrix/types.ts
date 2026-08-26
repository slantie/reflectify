export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export type ActivityType = "Lecture" | "Lab" | "Unknown" | "Tutorial" | "Library" | "Project"

export type DivisionBatch = {
  division: string
  batch: string | null
}

export type ParsedSubject = {
  subject_code: string
  semester: number
  division_batches: DivisionBatch[]
}

export type SubjectParseError = {
  error: string
}

export type FacultyScheduleEntry = {
  subject_string: string
  type: "Lecture" | "Lab" | "Unknown"
  time_slot: number
  parsed_subject_info: ParsedSubject | SubjectParseError | null
}

export type FacultySchedule = Record<Weekday, FacultyScheduleEntry[]>

export type DivisionTimetableEntry = {
  Subject: string
  Type: ActivityType
  Batch: string
  Day: Weekday
  Time_Slot: number | string
  Faculty: string
}

export type DesignatedFaculty = {
  designated_faculty: string
}

export type SubjectAllocation = {
  lectures: Record<string, DesignatedFaculty> | DesignatedFaculty
  labs: Record<string, DesignatedFaculty>
}

export type MatrixPipelineResult = {
  results: Record<string, Record<string, Record<string, Record<string, Record<string, SubjectAllocation>>>>>
  division_timetables?: Record<string, DivisionTimetableEntry[]>
  status: {
    success: boolean
    message: string
    errors: string[]
  }
}
