import ExcelJS from "exceljs"
import JSZip from "jszip"

import {
  type ActivityType,
  type DivisionBatch,
  type DivisionTimetableEntry,
  type FacultySchedule,
  type FacultyScheduleEntry,
  type MatrixPipelineResult,
  type ParsedSubject,
  type SubjectAllocation,
  type SubjectParseError,
  type Weekday,
  WEEKDAYS,
} from "@/lib/matrix/types"

const DAY_MAPPING: Record<string, Weekday> = {
  MON: "Monday",
  MONDAY: "Monday",
  TUES: "Tuesday",
  TUESDAY: "Tuesday",
  WED: "Wednesday",
  WEDNESDAY: "Wednesday",
  THUR: "Thursday",
  THURSDAY: "Thursday",
  FRI: "Friday",
  FRIDAY: "Friday",
  SAT: "Saturday",
  SATURDAY: "Saturday",
}

const SPECIAL_ACTIVITY_TYPES: Record<string, ActivityType> = {
  TUT: "Tutorial",
  TUTORIAL: "Tutorial",
  LIB: "Library",
  LIBRARY: "Library",
  PROJ: "Project",
  PROJECT: "Project",
  MP: "Project",
  MINIPROJECT: "Project",
}

type CellValue = ExcelJS.CellValue | null | undefined
type SheetRows = Array<Array<string | number | Date | null>>
type DivisionTables = Record<string, DivisionTimetableEntry[]>

async function loadWorkbook(buffer: ArrayBuffer | Uint8Array): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()

  try {
    await workbook.xlsx.load(buffer as never)
    return workbook
  } catch (initialError) {
    // Some otherwise-valid producers namespace every SpreadsheetML element (for
    // example, <x:workbook>). ExcelJS expects the default namespace form.
    const archive = await JSZip.loadAsync(buffer)
    const xmlFiles = Object.values(archive.files).filter((file) => file.name.endsWith(".xml"))
    let changed = false

    for (const file of xmlFiles) {
      const xml = await file.async("string")
      const normalized = xml.replace(/(<\/?)x:/g, "$1")
      if (normalized !== xml) {
        archive.file(file.name, normalized)
        changed = true
      }
    }

    if (!changed) throw initialError

    const normalizedBuffer = await archive.generateAsync({ type: "nodebuffer" })
    const normalizedWorkbook = new ExcelJS.Workbook()
    await normalizedWorkbook.xlsx.load(normalizedBuffer as never)
    return normalizedWorkbook
  }
}

function cleanExcelCell(value: CellValue): string | number | Date | null {
  if (value === null || value === undefined) return null

  if (typeof value === "string") {
    const cleaned = value.trim()
    return cleaned === "" ? null : cleaned
  }

  if (typeof value === "number" || value instanceof Date) return value
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    const cleaned = value.richText.map((part) => part.text).join("").trim()
    return cleaned === "" ? null : cleaned
  }
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    const cleaned = value.text.trim()
    return cleaned === "" ? null : cleaned
  }

  return String(value).trim() || null
}

function getMergedCellValue(cell: ExcelJS.Cell): CellValue {
  if (cell.isMerged && cell.master) return cell.master.value
  return cell.value
}

function getSheetRows(worksheet: ExcelJS.Worksheet): SheetRows {
  const rows: SheetRows = []

  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row: Array<string | number | Date | null> = []
    for (let columnNumber = 1; columnNumber <= worksheet.columnCount; columnNumber += 1) {
      row.push(cleanExcelCell(getMergedCellValue(worksheet.getCell(rowNumber, columnNumber))))
    }
    rows.push(row)
  }

  return rows
}

function asComparableString(value: string | number | Date | null | undefined): string {
  return value === null || value === undefined ? "None" : String(value)
}

function asText(value: string | number | Date | null | undefined): string {
  return value === null || value === undefined ? "" : String(value)
}

function toInteger(value: string | number | Date | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value)
  const numeric = Number(value)
  return Number.isInteger(numeric) ? numeric : null
}

function extractSheetData(worksheet: ExcelJS.Worksheet): { headers: string[]; rows: SheetRows } | null {
  const sheetRows = getSheetRows(worksheet)
  const headerIndex = sheetRows.findIndex((row) => asComparableString(row[1]) === "SLOT")

  if (headerIndex === -1) return null

  const rawHeaders = sheetRows[headerIndex] ?? []
  const normalizedHeaders = rawHeaders.map((header) => {
    if (typeof header !== "string") return header
    if (/^L\d+$/.test(header)) return null
    if (header.includes("/")) return header.split("/")[0]?.replaceAll(" ", "").trim() ?? null
    return header
  })

  const firstEmptyHeader = normalizedHeaders.findIndex((header) => header === null)
  const usableColumnCount = firstEmptyHeader === -1 ? normalizedHeaders.length : firstEmptyHeader
  const headers = normalizedHeaders.slice(0, usableColumnCount).map(asText)
  const rows = sheetRows
    .slice(headerIndex + 1)
    .map((row) => row.slice(0, usableColumnCount))
    .filter((row) => row.some((cell) => cell !== null && cell !== ""))

  return { headers, rows }
}

export function extractSubjectDetails(subjectString: string): ParsedSubject | SubjectParseError | null {
  if (typeof subjectString !== "string" || !subjectString.trim()) return null

  const withoutParentheses = subjectString.replace(/\(.*?\)/g, "").trim().replace(/\s*&\s*/g, "&")
  const tokens = withoutParentheses.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { error: `Empty subject string: ${withoutParentheses}` }

  let semester: number | null = null
  for (const token of tokens) {
    if (/^\d+$/.test(token)) semester = Number.parseInt(token, 10)
  }

  if (!semester) {
    for (const token of tokens) {
      const match = token.match(/^(\d+)[A-Z]/i)
      if (match?.[1]) {
        semester = Number.parseInt(match[1], 10)
        break
      }
    }
  }

  if (!semester) return { error: `Semester not found in: ${withoutParentheses}` }

  let subjectCode: string | null = null
  for (const token of tokens) {
    if (SPECIAL_ACTIVITY_TYPES[token.trim().toUpperCase()]) {
      subjectCode = token.trim().toUpperCase()
      break
    }
  }

  if (!subjectCode) {
    for (const token of tokens) {
      if (/^[A-Z&]{2,6}$/i.test(token)) {
        subjectCode = token.trim().toUpperCase()
        break
      }
    }
  }

  if (!subjectCode) return { error: `Subject code not found in: ${withoutParentheses}` }

  const divisionString = tokens.filter((token) => token !== String(semester) && token !== subjectCode).join("")
  let divisionBatches: DivisionBatch[]

  if (divisionString.toUpperCase().includes("ALL")) {
    divisionBatches = [{ division: "ALL", batch: null }]
  } else {
    divisionBatches = divisionString
      .split("/")
      .map((segment) => {
        const division = [...segment].filter((character) => /[a-z]/i.test(character)).join("").trim()
        const batch = segment.match(/(\d+\*?)$/)?.[1] ?? null
        return division ? { division, batch } : null
      })
      .filter((entry): entry is DivisionBatch => entry !== null)

    divisionBatches = Array.from(
      new Map(divisionBatches.map((entry) => [`${entry.division}\u0000${entry.batch ?? ""}`, entry])).values()
    ).sort((left, right) => left.division.localeCompare(right.division) || (left.batch ?? "").localeCompare(right.batch ?? ""))
  }

  return { subject_code: subjectCode, semester, division_batches: divisionBatches }
}

function createEmptyFacultySchedule(): FacultySchedule {
  return {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  }
}

function buildFacultySchedules(headers: string[], rows: SheetRows): Record<string, FacultySchedule> {
  const facultySchedules: Record<string, FacultySchedule> = {}
  const facultyColumns = headers.slice(2).map((faculty, index) => ({ faculty, columnIndex: index + 2 }))

  for (const { faculty, columnIndex } of facultyColumns) {
    const schedule = createEmptyFacultySchedule()
    facultySchedules[faculty] = schedule

    let rowIndex = 0
    while (rowIndex < rows.length) {
      const row = rows[rowIndex] ?? []
      const dayText = asText(row[0]).trim().toUpperCase()
      const day = DAY_MAPPING[dayText]
      const subject = row[columnIndex]
      const timeSlot = toInteger(row[1])

      if (subject !== null && subject !== "" && day && timeSlot !== null) {
        const subjectText = asText(subject)
        let endIndex = rowIndex
        while (
          endIndex + 1 < rows.length &&
          rows[endIndex + 1]?.[columnIndex] === subject &&
          asText(rows[endIndex + 1]?.[0]).trim().toUpperCase() === dayText
        ) {
          endIndex += 1
        }

        const blockLength = endIndex - rowIndex + 1
        const type = blockLength === 2 ? "Lab" : blockLength === 1 ? "Lecture" : "Unknown"
        schedule[day].push({
          subject_string: subjectText,
          type,
          time_slot: timeSlot,
          parsed_subject_info: extractSubjectDetails(subjectText),
        })
        rowIndex = endIndex + 1
        continue
      }

      rowIndex += 1
    }
  }

  return facultySchedules
}

function isParsedSubject(value: FacultyScheduleEntry["parsed_subject_info"]): value is ParsedSubject {
  return Boolean(value && "semester" in value && value.semester !== null)
}

function isParseError(value: FacultyScheduleEntry["parsed_subject_info"]): value is SubjectParseError {
  return Boolean(value && "error" in value)
}

function sortTimeSlot(timeSlot: number | string): number {
  if (typeof timeSlot === "string" && timeSlot.includes("-")) return Number.parseInt(timeSlot.split("-")[0] ?? "", 10) || Number.POSITIVE_INFINITY
  const numeric = Number(timeSlot)
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY
}

function standardizeTimetable(entries: DivisionTimetableEntry[]): DivisionTimetableEntry[] {
  return entries
    .map((entry) => ({
      ...entry,
      Time_Slot: entry.Type === "Lab" && typeof entry.Time_Slot === "number" ? `${entry.Time_Slot}-${entry.Time_Slot + 1}` : entry.Time_Slot,
    }))
    .sort((left, right) => {
      const day = left.Day.localeCompare(right.Day)
      if (day !== 0) return day
      const slot = sortTimeSlot(left.Time_Slot) - sortTimeSlot(right.Time_Slot)
      if (slot !== 0) return slot
      return left.Batch.localeCompare(right.Batch)
    })
    .map((entry) => ({
      ...entry,
      Type: SPECIAL_ACTIVITY_TYPES[entry.Subject.trim().toUpperCase()] ?? entry.Type,
    }))
}

function generateClassSchedules(facultySchedules: Record<string, FacultySchedule>, errors: string[]): DivisionTables {
  const semesterDivisions = new Map<number, Set<string>>()
  const divisionTables: Record<string, DivisionTimetableEntry[]> = {}

  for (const [faculty, schedule] of Object.entries(facultySchedules)) {
    for (const [day, sessions] of Object.entries(schedule) as Array<[Weekday, FacultyScheduleEntry[]]>) {
      for (const session of sessions) {
        if (!isParsedSubject(session.parsed_subject_info)) {
          if (isParseError(session.parsed_subject_info)) {
            errors.push(`Error parsing subject info for faculty ${faculty}, day ${day}: ${session.parsed_subject_info.error}`)
          }
          continue
        }

        const divisions = semesterDivisions.get(session.parsed_subject_info.semester) ?? new Set<string>()
        for (const entry of session.parsed_subject_info.division_batches) {
          if (entry.division !== "ALL") divisions.add(entry.division)
        }
        semesterDivisions.set(session.parsed_subject_info.semester, divisions)
      }
    }
  }

  for (const [faculty, schedule] of Object.entries(facultySchedules)) {
    for (const [day, sessions] of Object.entries(schedule) as Array<[Weekday, FacultyScheduleEntry[]]>) {
      for (const session of sessions) {
        if (!isParsedSubject(session.parsed_subject_info)) continue

        const parsed = session.parsed_subject_info
        const targets = parsed.division_batches[0]?.division === "ALL"
          ? [...(semesterDivisions.get(parsed.semester) ?? new Set<string>())].sort().map((division) => ({ division, batch: null }))
          : parsed.division_batches

        for (const target of targets) {
          const divisionKey = `${parsed.semester}${target.division}`
          const entry: DivisionTimetableEntry = {
            Subject: parsed.subject_code,
            Type: session.type,
            Batch: target.batch ?? "-",
            Day: day,
            Time_Slot: session.time_slot,
            Faculty: faculty,
          }
          ;(divisionTables[divisionKey] ??= []).push(entry)
        }
      }
    }
  }

  return Object.fromEntries(Object.entries(divisionTables).map(([key, entries]) => [key, standardizeTimetable(entries)]))
}

function deduplicateCourseCatalog(entries: DivisionTimetableEntry[]): DivisionTimetableEntry[] {
  const catalog = new Map<string, DivisionTimetableEntry>()
  for (const entry of entries) {
    const condensed = { Subject: entry.Subject, Type: entry.Type, Batch: entry.Batch, Faculty: entry.Faculty }
    catalog.set(JSON.stringify(condensed), { ...condensed, Day: entry.Day, Time_Slot: entry.Time_Slot })
  }

  return [...catalog.values()].sort((left, right) => left.Subject.localeCompare(right.Subject) || left.Batch.localeCompare(right.Batch))
}

function joinFaculty(entries: DivisionTimetableEntry[]): string {
  return [...new Set(entries.map((entry) => entry.Faculty).filter(Boolean))].join(", ")
}

function buildHierarchicalSchedule(divisionTables: DivisionTables, department: string, college: string) {
  const results: MatrixPipelineResult["results"] = { [college]: { [department]: {} } }
  const departmentResult = results[college]?.[department]
  if (!departmentResult) return results

  for (const [divisionKey, detailedEntries] of Object.entries(divisionTables)) {
    // This intentionally preserves the legacy single-character semester split.
    const semester = divisionKey[0] ?? ""
    const division = divisionKey.slice(1)
    const divisionResult = (departmentResult[semester] ??= {})[division] ??= {}
    const catalog = deduplicateCourseCatalog(detailedEntries)

    const bySubject = new Map<string, DivisionTimetableEntry[]>()
    for (const entry of catalog) (bySubject.get(entry.Subject) ?? bySubject.set(entry.Subject, []).get(entry.Subject)!).push(entry)

    for (const [subject, entries] of bySubject) {
      const allocation: SubjectAllocation = { lectures: {}, labs: {} }
      const lectures = entries.filter((entry) => entry.Type === "Lecture")
      const labs = entries.filter((entry) => entry.Type === "Lab")
      const lectureBatches = [...new Set(lectures.map((entry) => entry.Batch).filter((batch) => batch !== "-"))]

      if (lectureBatches.length > 0) {
        const batchedLectures: Record<string, { designated_faculty: string }> = {}
        for (const batch of lectureBatches) {
          batchedLectures[batch] = { designated_faculty: joinFaculty(lectures.filter((entry) => entry.Batch === batch)) }
        }
        allocation.lectures = batchedLectures
      } else if (lectures.length > 0) {
        allocation.lectures = { designated_faculty: joinFaculty(lectures) }
      }

      for (const batch of [...new Set(labs.map((entry) => entry.Batch))]) {
        allocation.labs[batch] = { designated_faculty: joinFaculty(labs.filter((entry) => entry.Batch === batch)) }
      }

      divisionResult[subject] = allocation
    }
  }

  return results
}

export async function processFacultyMatrix(
  buffer: ArrayBuffer | Uint8Array,
  department: string,
  college = "LDRP-ITR"
): Promise<MatrixPipelineResult> {
  const errors: string[] = []
  let workbook: ExcelJS.Workbook

  try {
    workbook = await loadWorkbook(buffer)
  } catch (error) {
    return {
      results: {},
      status: {
        success: false,
        message: "Failed to extract any faculty schedules. Please check the input file.",
        errors: [`Error loading Excel workbook: ${error instanceof Error ? error.message : String(error)}`],
      },
    }
  }

  const facultySchedules: Record<string, FacultySchedule> = {}
  for (const worksheet of workbook.worksheets) {
    const sheetData = extractSheetData(worksheet)
    if (!sheetData) {
      errors.push(`Warning: No valid data extracted from sheet '${worksheet.name}'. It might be empty or malformed.`)
      continue
    }

    const sheetSchedules = buildFacultySchedules(sheetData.headers, sheetData.rows)
    for (const [faculty, schedule] of Object.entries(sheetSchedules)) {
      const current = facultySchedules[faculty]
      if (!current) {
        facultySchedules[faculty] = schedule
      } else {
        for (const day of WEEKDAYS) current[day].push(...schedule[day])
      }
    }
  }

  for (const schedule of Object.values(facultySchedules)) {
    for (const day of WEEKDAYS) schedule[day].sort((left, right) => left.time_slot - right.time_slot)
  }

  if (Object.keys(facultySchedules).length === 0) {
    return {
      results: {},
      status: { success: false, message: "Failed to extract any faculty schedules. Please check the input file.", errors },
    }
  }

  const divisionTimetables = generateClassSchedules(facultySchedules, errors)
  if (Object.keys(divisionTimetables).length === 0) {
    return {
      results: {},
      status: {
        success: false,
        message: "Failed to generate division-specific timetables. This might be due to parsing errors or missing data.",
        errors,
      },
    }
  }

  const results = buildHierarchicalSchedule(divisionTimetables, department, college)
  return {
    results,
    division_timetables: divisionTimetables,
    status: {
      success: errors.length === 0,
      message: errors.length === 0 ? "Timetable processed successfully." : "Timetable processed with warnings/errors.",
      errors,
    },
  }
}
