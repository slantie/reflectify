"use client"

import { useMemo, useState } from "react"
import {
  CaretDownIcon,
  DownloadSimpleIcon,
  FileCsvIcon,
  FileXlsIcon,
} from "@phosphor-icons/react"
import toast from "react-hot-toast"

import type {
  AnalyticsWorkspaceData,
  ComparisonRow,
  FacultyRating,
  FacultySemesterRating,
  SemesterParticipation,
} from "@/components/analytics/analytics-workspace"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ExportData = {
  workspaceData: AnalyticsWorkspaceData
  overallRating: number | null
  totalResponses: number
  uniqueStudents: number
  uniqueSubjects: number
  uniqueFaculty: number
  semesterParticipation: SemesterParticipation[]
}

type ExportRow = Record<string, string | number>

type ExportSheet = {
  name: string
  data: ExportRow[]
}

function formatDate() {
  return new Date().toISOString().split("T")[0]
}

function downloadFile(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsv(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(data: ExportRow[]) {
  if (!data.length) return ""
  const columns = Object.keys(data[0] ?? {})
  return [
    columns.map(escapeCsv).join(","),
    ...data.map((row) =>
      columns.map((column) => escapeCsv(row[column] ?? "")).join(",")
    ),
  ].join("\n")
}

function weightedYearTrends(rows: ComparisonRow[]) {
  const totals = new Map<string, { weighted: number; responses: number }>()
  for (const row of rows) {
    for (const [year, rating] of Object.entries(row.values)) {
      const responses = row.responses[year] ?? 0
      const total = totals.get(year) ?? { weighted: 0, responses: 0 }
      total.weighted += rating * responses
      total.responses += responses
      totals.set(year, total)
    }
  }
  return [...totals.entries()]
    .map(([year, total]) => ({
      year,
      rating: total.responses > 0 ? total.weighted / total.responses : 0,
      responses: total.responses,
    }))
    .sort((first, second) => first.year.localeCompare(second.year))
}

function departmentComparison(rows: ComparisonRow[], selectedYear?: string) {
  const latestYear =
    selectedYear ||
    rows
      .flatMap((row) => Object.keys(row.values))
      .sort()
      .at(-1)

  if (!latestYear) return []
  return rows
    .map((row) => ({
      name: row.label,
      rating: row.values[latestYear] ?? 0,
      responses: row.responses[latestYear] ?? 0,
    }))
    .filter((row) => row.responses > 0)
    .sort((first, second) => second.rating - first.rating)
}

function facultyDistribution(faculty: FacultyRating[]) {
  return [
    {
      label: "Excellent (9.0+)",
      value: faculty.filter((entry) => entry.average >= 9).length,
    },
    {
      label: "Good (8.0-9.0)",
      value: faculty.filter((entry) => entry.average >= 8 && entry.average < 9)
        .length,
    },
    {
      label: "Average (7.0-8.0)",
      value: faculty.filter((entry) => entry.average >= 7 && entry.average < 8)
        .length,
    },
    {
      label: "Needs Improvement (<7.0)",
      value: faculty.filter((entry) => entry.average < 7).length,
    },
  ]
}

function facultySemesterRows(
  faculty: FacultySemesterRating[] = []
): ExportRow[] {
  return faculty.map((entry, index) => ({
    "Sr. No.": index + 1,
    "Faculty Name": entry.detail || entry.label,
    "Semester 1": entry.semesters[1]?.toFixed(2) ?? "0",
    "Semester 2": entry.semesters[2]?.toFixed(2) ?? "0",
    "Semester 3": entry.semesters[3]?.toFixed(2) ?? "0",
    "Semester 4": entry.semesters[4]?.toFixed(2) ?? "0",
    "Semester 5": entry.semesters[5]?.toFixed(2) ?? "0",
    "Semester 6": entry.semesters[6]?.toFixed(2) ?? "0",
    "Semester 7": entry.semesters[7]?.toFixed(2) ?? "0",
    "Semester 8": entry.semesters[8]?.toFixed(2) ?? "0",
    Average: entry.average.toFixed(2),
    "Total Responses (Questions)": entry.responses,
    "Total Students": entry.students,
  }))
}

function semesterOverviewRows(
  participation: SemesterParticipation[]
): ExportRow[] {
  return participation.map((entry) => ({
    "Academic Year": entry.academicYear,
    Department: entry.department,
    Semester: `Semester ${entry.semesterNumber}`,
    "Total Students": entry.students,
    "Average Rating": entry.average.toFixed(2),
    "Total Responses (Questions)": entry.responses,
    Divisions: entry.divisions.length,
    "Subject teaching groups": entry.subjects.length,
  }))
}

function semesterDetailSheets(
  participation: SemesterParticipation[]
): ExportSheet[] {
  return participation.map((entry) => ({
    name: `${entry.academicYear} ${entry.department} S${entry.semesterNumber}`.slice(
      0,
      31
    ),
    data: [
      {
        Section: `Overall Semester ${entry.semesterNumber}`,
        Item: `${entry.department} · ${entry.academicYear}`,
        "Teaching type": "—",
        "Unique Students": entry.students,
        "Total Responses (Questions)": entry.responses,
        "Average Rating": entry.average.toFixed(2),
      },
      ...entry.subjects.map((subject) => ({
        Section: "Subject-wise participation",
        Item: subject.detail || subject.label,
        "Teaching type": subject.teachingType,
        "Unique Students": subject.students,
        "Total Responses (Questions)": subject.responses,
        "Average Rating": subject.average.toFixed(2),
      })),
      ...entry.divisions.map((division) => ({
        Section: "Division-wise status",
        Item: `Division ${division.label}`,
        "Teaching type": "—",
        "Unique Students": division.students,
        "Total Responses (Questions)": division.responses,
        "Average Rating": division.average.toFixed(2),
      })),
    ],
  }))
}

function createInsights({
  overallRating,
  totalResponses,
  faculty,
  departmentRows,
  healthTrend,
}: {
  overallRating: number | null
  totalResponses: number
  faculty: FacultyRating[]
  departmentRows: { name: string; rating: number; responses: number }[]
  healthTrend: number
}) {
  const needsAttention = faculty.filter((entry) => entry.average < 7).length
  const excellent = faculty.filter((entry) => entry.average >= 9).length
  const insights: ExportRow[] = []

  if (needsAttention > 0) {
    insights.push({
      Priority: needsAttention > 3 ? "HIGH" : "MEDIUM",
      Title: `${needsAttention} faculty need attention`,
      Description: `${Math.round((needsAttention / faculty.length) * 100)}% of evaluated faculty have ratings below 7.0.`,
      "Recommended Action":
        "Review subject-level feedback and arrange support.",
    })
  }
  if (healthTrend < -5) {
    insights.push({
      Priority: "HIGH",
      Title: "Declining performance trend",
      Description: `Overall ratings dropped by ${Math.abs(healthTrend).toFixed(1)}% from the previous academic year.`,
      "Recommended Action": "Compare the affected years and teaching groups.",
    })
  }
  if (departmentRows.length > 1) {
    const ratings = departmentRows.map((entry) => entry.rating)
    const gap = Math.max(...ratings) - Math.min(...ratings)
    if (gap > 1) {
      const lowest = departmentRows.at(-1)
      insights.push({
        Priority: "MEDIUM",
        Title: "Department performance gap",
        Description: `${lowest?.name ?? "One department"} is ${gap.toFixed(1)} points below the top department.`,
        "Recommended Action":
          "Compare faculty and subject ratings by department.",
      })
    }
  }
  if (totalResponses < 50) {
    insights.push({
      Priority: "MEDIUM",
      Title: "Low response volume",
      Description: `Only ${totalResponses} numeric feedback responses are available in this scope.`,
      "Recommended Action":
        "Review the form completion rate before taking action.",
    })
  }
  if (excellent > faculty.length * 0.3 && faculty.length > 0) {
    insights.push({
      Priority: "LOW",
      Title: "Strong faculty performance",
      Description: `${Math.round((excellent / faculty.length) * 100)}% of evaluated faculty have excellent ratings (9.0+).`,
      "Recommended Action":
        "Recognise strong practices and share them across departments.",
    })
  }
  if (!insights.length) {
    insights.push({
      Priority: "LOW",
      Title:
        overallRating === null
          ? "No ratings available"
          : "Performance on track",
      Description:
        overallRating === null
          ? "No numeric feedback is available for the selected scope."
          : "All available metrics are within the expected range.",
      "Recommended Action":
        "Continue monitoring feedback completion and trends.",
    })
  }
  return insights
}

function buildReport(data: ExportData, selectedYear?: string) {
  const faculty = [...data.workspaceData.faculty].sort(
    (first, second) => second.average - first.average
  )
  const averageFacultyRating = faculty.length
    ? faculty.reduce((sum, entry) => sum + entry.average, 0) / faculty.length
    : 0
  const topPerformers = faculty.slice(0, 5)
  const bottomPerformers = faculty.slice(-5).reverse()
  const academicYearTrends = weightedYearTrends(data.workspaceData.departments)
  const departmentRows = departmentComparison(
    data.workspaceData.departments,
    selectedYear
  )
  const currentTrend = academicYearTrends.at(-1)
  const previousTrend = academicYearTrends.at(-2)
  const healthTrend =
    currentTrend && previousTrend && previousTrend.rating > 0
      ? ((currentTrend.rating - previousTrend.rating) / previousTrend.rating) *
        100
      : 0

  const summary: ExportRow[] = [
    {
      Metric: "Health Score",
      Value: data.overallRating?.toFixed(2) ?? "N/A",
      Unit: "/ 10.0",
    },
    {
      Metric: "Total Responses",
      Value: data.totalResponses,
      Unit: "responses",
    },
    { Metric: "Unique Students", Value: data.uniqueStudents, Unit: "students" },
    { Metric: "Total Faculty", Value: data.uniqueFaculty, Unit: "members" },
    { Metric: "Total Subjects", Value: data.uniqueSubjects, Unit: "subjects" },
    {
      Metric: "Total Departments",
      Value: departmentRows.length,
      Unit: "departments",
    },
    {
      Metric: "Health Trend",
      Value: `${healthTrend > 0 ? "+" : ""}${healthTrend.toFixed(1)}%`,
      Unit: "",
    },
  ]

  const performerRows = (performers: FacultyRating[]) =>
    performers.map((entry, index) => ({
      Rank: index + 1,
      Name: entry.detail || entry.label,
      Rating: entry.average.toFixed(2),
      Responses: entry.responses,
      "vs Average": `${entry.average >= averageFacultyRating ? "+" : ""}${(((entry.average - averageFacultyRating) / (averageFacultyRating || 1)) * 100).toFixed(1)}%`,
    }))

  const sheets: ExportSheet[] = [
    {
      name: "Faculty Performance",
      data: facultySemesterRows(data.workspaceData.facultySemesters ?? []),
    },
    {
      name: "Semester Overview",
      data: semesterOverviewRows(data.semesterParticipation),
    },
    ...semesterDetailSheets(data.semesterParticipation),
    { name: "Summary", data: summary },
    { name: "Top Performers", data: performerRows(topPerformers) },
    { name: "Needs Attention", data: performerRows(bottomPerformers) },
    {
      name: "Faculty Distribution",
      data: facultyDistribution(faculty).map((entry) => ({
        Category: entry.label,
        Count: entry.value,
        Percentage: `${faculty.length ? ((entry.value / faculty.length) * 100).toFixed(1) : 0}%`,
      })),
    },
    {
      name: "Academic Year Trends",
      data: academicYearTrends.map((entry) => ({
        "Academic Year": entry.year,
        "Average Rating": entry.rating.toFixed(2),
        Responses: entry.responses,
      })),
    },
    {
      name: "Department Comparison",
      data: departmentRows.map((entry) => ({
        Department: entry.name,
        "Average Rating": entry.rating.toFixed(2),
        Responses: entry.responses,
      })),
    },
    {
      name: "Actionable Insights",
      data: createInsights({
        overallRating: data.overallRating,
        totalResponses: data.totalResponses,
        faculty,
        departmentRows,
        healthTrend,
      }),
    },
  ]

  return { summary, sheets }
}

export function AnalyticsExport({
  data,
  selectedYear,
}: {
  data: ExportData
  selectedYear?: string
}) {
  const [exporting, setExporting] = useState(false)
  const report = useMemo(
    () => buildReport(data, selectedYear),
    [data, selectedYear]
  )
  const hasData = data.workspaceData.faculty.length > 0

  function exportCsv() {
    if (!hasData) {
      toast.error("No analytics data is available to export")
      return
    }
    downloadFile(
      toCsv(report.summary),
      `Analytics_Summary_${formatDate()}.csv`,
      "text/csv;charset=utf-8;"
    )
    toast.success("Analytics summary exported to CSV")
  }

  async function exportExcel() {
    if (!hasData) {
      toast.error("No analytics data is available to export")
      return
    }
    setExporting(true)
    try {
      const ExcelJS = await import("exceljs")
      const workbook = new ExcelJS.Workbook()

      for (const sheet of report.sheets) {
        if (!sheet.data.length) continue
        const columns = Object.keys(sheet.data[0] ?? {})
        const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31))
        worksheet.columns = columns.map((header, index) => ({
          header,
          key: `column-${index}`,
          width: Math.min(Math.max(header.length + 2, 12), 50),
        }))
        worksheet.getRow(1).font = { bold: true, size: 11 }
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E5E5" },
        }
        worksheet.getRow(1).alignment = {
          vertical: "middle",
          horizontal: "center",
        }
        for (const row of sheet.data) {
          worksheet.addRow(
            Object.fromEntries(
              columns.map((column, index) => [`column-${index}`, row[column]])
            )
          )
        }
        worksheet.columns.forEach((column, index) => {
          const header = columns[index] ?? ""
          const maxLength = Math.max(
            header.length,
            ...sheet.data.map((row) => String(row[header] ?? "").length)
          )
          column.width = Math.min(maxLength + 2, 50)
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      downloadFile(
        buffer,
        `Analytics_Report_${formatDate()}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      toast.success("Analytics report exported to Excel")
    } catch (error) {
      console.error("Analytics export failed", error)
      toast.error("Failed to export the analytics report")
    } finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting}
          />
        }
      >
        <DownloadSimpleIcon className="size-4" weight="bold" />
        {exporting ? "Preparing…" : "Export"}
        <CaretDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={exportCsv}>
          <FileCsvIcon className="size-4 text-primary" weight="fill" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>
          <FileXlsIcon className="size-4 text-primary" weight="fill" />
          <span>Export as Excel</span>
          <span className="ml-auto text-xs text-muted-foreground">
            Multi-sheet
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
