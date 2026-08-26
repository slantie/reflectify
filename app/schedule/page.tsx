import { connection } from "next/server"
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr"

import {
  TimetableWorkspace,
  type ScheduleDivision,
  type ScheduleFaculty,
} from "@/components/schedule/timetable-workspace"
import { prisma } from "@/lib/db"

export const metadata = {
  title: "Schedule | Reflectify",
  description: "View weekly class and faculty timetables.",
}

export default async function SchedulePage() {
  await connection()

  const [divisions, faculties] = await Promise.all([
    prisma.division.findMany({
      where: {
        isDeleted: false,
        timetable: { is: { isDeleted: false } },
      },
      select: {
        id: true,
        divisionName: true,
        studentCount: true,
        department: { select: { id: true, name: true, abbreviation: true } },
        semester: {
          select: {
            id: true,
            semesterNumber: true,
            semesterType: true,
            academicYear: {
              select: { id: true, yearString: true, isActive: true },
            },
          },
        },
        timetable: { select: { timetableData: true } },
      },
      orderBy: [
        { semester: { academicYear: { yearString: "desc" } } },
        { department: { name: "asc" } },
        { semester: { semesterNumber: "asc" } },
        { divisionName: "asc" },
      ],
    }),
    prisma.faculty.findMany({
      where: { isDeleted: false },
      select: { name: true, abbreviation: true, designation: true },
      orderBy: { name: "asc" },
    }),
  ])

  const timetableDivisions: ScheduleDivision[] = divisions.map((division) => ({
    id: division.id,
    name: division.divisionName,
    studentCount: division.studentCount,
    department: division.department,
    semester: {
      id: division.semester.id,
      number: division.semester.semesterNumber,
      type: division.semester.semesterType,
      academicYear: division.semester.academicYear,
    },
    entries: Array.isArray(division.timetable?.timetableData)
      ? division.timetable.timetableData
      : [],
  }))
  const timetableFaculties: ScheduleFaculty[] = faculties.map((faculty) => ({
    name: faculty.name,
    abbreviation: faculty.abbreviation,
    designation: faculty.designation,
  }))

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="border-b pb-6">
        <div className="flex items-center gap-2 text-primary">
          <CalendarDotsIcon className="size-5" weight="fill" />
          <p className="text-sm font-medium">Teaching timetable</p>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Find your weekly schedule
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          View a class timetable or see every teaching session assigned to a
          faculty member.
        </p>
      </div>
      <TimetableWorkspace
        divisions={timetableDivisions}
        faculties={timetableFaculties}
      />
    </div>
  )
}
