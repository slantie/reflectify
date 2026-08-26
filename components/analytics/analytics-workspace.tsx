"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import {
  BookOpenIcon,
  ChartBarIcon,
  ChartLineUpIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type ComparisonRow = {
  label: string
  values: Record<string, number>
  responses: Record<string, number>
}

export type SubjectRating = {
  id: string
  label: string
  detail: string
  lecture: number | null
  lab: number | null
  overall: number
  responses: number
  students: number
  faculties: number
}

export type FacultyRating = {
  id: string
  label: string
  detail: string
  average: number
  responses: number
  students: number
  subjects: number
  divisions: number
}

export type FacultySemesterRating = FacultyRating & {
  semesters: Record<number, number>
  semesterResponses: Record<number, number>
}

export type SemesterParticipation = {
  academicYear: string
  department: string
  semesterNumber: number
  students: number
  responses: number
  average: number
  subjects: {
    label: string
    detail: string
    teachingType: "Lecture" | "Lab"
    students: number
    responses: number
    average: number
  }[]
  divisions: {
    label: string
    students: number
    responses: number
    average: number
  }[]
}

export type SubjectFacultyRating = {
  id: string
  label: string
  detail: string
  overall: number
  responses: number
  faculty: FacultyRating[]
}

export type BatchRating = {
  id: string
  label: string
  detail: string
  average: number
  responses: number
  students: number
}

export type CategoryRating = {
  id: string
  label: string
  average: number
  responses: number
  students: number
}

export type AnalyticsWorkspaceData = {
  years: string[]
  subjects: SubjectRating[]
  faculty: FacultyRating[]
  facultySemesters: FacultySemesterRating[]
  subjectFaculty: SubjectFacultyRating[]
  departments: ComparisonRow[]
  semesters: ComparisonRow[]
  divisions: ComparisonRow[]
  batches: BatchRating[]
  categories: CategoryRating[]
}

const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const scoreConfig = {
  lecture: { label: "Lecture", color: "var(--chart-1)" },
  lab: { label: "Lab", color: "var(--chart-2)" },
  rating: { label: "Average rating", color: "var(--chart-1)" },
} satisfies ChartConfig

function averageFormatter(value: unknown) {
  const score = Number(Array.isArray(value) ? value[0] : value)
  return Number.isFinite(score) ? `${score.toFixed(1)} / 10` : "—"
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-72 flex-col items-center justify-center text-center">
      <ChartBarIcon className="size-9 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">No ratings match these filters</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Try a different academic scope or wait for submitted feedback.
      </p>
    </div>
  )
}

function SubjectRatingsChart({ data }: { data: SubjectRating[] }) {
  if (!data.length) return <EmptyChart />

  return (
    <ChartContainer config={scoreConfig} className="h-80 w-full">
      <BarChart
        data={data.slice(0, 14)}
        margin={{ top: 8, right: 4, left: -22 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={18}
          tick={{ fontSize: 11 }}
        />
        <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.detail ?? "Subject"
              }
              formatter={(value, name, item) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {String(name ?? "")}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {averageFormatter(value)}
                    {item.payload.responses
                      ? ` · ${item.payload.responses} responses`
                      : ""}
                  </span>
                </div>
              )}
            />
          }
        />
        <Legend />
        <Bar
          dataKey="lecture"
          name="Lecture"
          fill="var(--color-lecture)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="lab"
          name="Lab"
          fill="var(--color-lab)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

function FacultyForSubjectChart({ data }: { data: SubjectFacultyRating[] }) {
  const [subjectId, setSubjectId] = useState(data[0]?.id ?? "")
  const selectedSubjectId = data.some((subject) => subject.id === subjectId)
    ? subjectId
    : (data[0]?.id ?? "")
  const subject = data.find((entry) => entry.id === selectedSubjectId)

  if (!subject || !data.length) return <EmptyChart />
  const chartData = subject.faculty.slice(0, 14)

  return (
    <div className="space-y-5">
      <div className="max-w-md">
        <Select
          value={selectedSubjectId}
          onValueChange={(value) => setSubjectId(value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a subject" />
          </SelectTrigger>
          <SelectContent>
            {data.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.label} · {entry.detail}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={scoreConfig} className="h-72 w-full">
        <BarChart data={chartData} margin={{ top: 10, right: 6, left: -22 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fontSize: 11 }}
          />
          <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.detail ?? "Faculty"
                }
                formatter={(value, _name, item) => (
                  <div className="flex flex-1 items-center justify-between gap-4">
                    <span className="text-muted-foreground">Average</span>
                    <span className="font-mono font-medium tabular-nums">
                      {averageFormatter(value)} · {item.payload.responses}{" "}
                      responses
                    </span>
                  </div>
                )}
              />
            }
          />
          <ReferenceLine
            y={subject.overall}
            stroke="var(--chart-1)"
            strokeDasharray="4 4"
          />
          <Bar
            dataKey="average"
            name="Faculty rating"
            fill="var(--color-rating)"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="text-center text-xs text-muted-foreground">
        Dashed line: {subject.label} overall average (
        {subject.overall.toFixed(1)} / 10)
      </p>
    </div>
  )
}

function MultiYearComparisonChart({
  rows,
  years,
}: {
  rows: ComparisonRow[]
  years: string[]
}) {
  if (!rows.length) return <EmptyChart />
  const config = years.reduce<ChartConfig>((result, year, index) => {
    result[year] = { label: year, color: palette[index % palette.length] }
    return result
  }, {})
  const data = rows.slice(0, 14).map((row) => ({
    label: row.label,
    ...row.values,
    responses: row.responses,
  }))

  return (
    <ChartContainer config={config} className="h-80 w-full">
      <BarChart data={data} margin={{ top: 10, right: 4, left: -22 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fontSize: 11 }}
        />
        <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {String(name ?? "")}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {averageFormatter(value)}
                    {item.payload.responses?.[String(name ?? "")]
                      ? ` · ${item.payload.responses[String(name ?? "")]} responses`
                      : ""}
                  </span>
                </div>
              )}
            />
          }
        />
        <Legend />
        {years.map((year) => (
          <Bar
            key={year}
            dataKey={year}
            fill={`var(--color-${year})`}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

function RankingChart({ data }: { data: FacultyRating[] | BatchRating[] }) {
  if (!data.length) return <EmptyChart />
  return (
    <ChartContainer config={scoreConfig} className="h-[31rem] w-full">
      <BarChart
        data={data.slice(0, 16)}
        layout="vertical"
        margin={{ top: 8, right: 12, left: 12 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 10]}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          dataKey="label"
          type="category"
          width={102}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {item.payload.detail}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {averageFormatter(value)} · {item.payload.responses}{" "}
                    responses
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="average"
          fill="var(--color-rating)"
          radius={[0, 5, 5, 0]}
          barSize={22}
        />
      </BarChart>
    </ChartContainer>
  )
}

function CategorySignalChart({ data }: { data: CategoryRating[] }) {
  if (!data.length) return <EmptyChart />

  return (
    <ChartContainer config={scoreConfig} className="h-80 w-full">
      <BarChart
        data={data.slice(0, 10)}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 20, bottom: 8 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 10]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          dataKey="label"
          type="category"
          width={122}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {item.payload.label}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {averageFormatter(value)} · {item.payload.responses}{" "}
                    responses
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="average"
          name="Average rating"
          fill="var(--color-rating)"
          radius={[0, 5, 5, 0]}
          barSize={22}
        />
      </BarChart>
    </ChartContainer>
  )
}

function FacultyTrendTable({ data }: { data: FacultyRating[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr>
            <th className="px-0 py-3 font-medium">Faculty</th>
            <th className="px-3 py-3 text-right font-medium">Average</th>
            <th className="px-3 py-3 text-right font-medium">Responses</th>
            <th className="px-3 py-3 text-right font-medium">Students</th>
            <th className="px-0 py-3 text-right font-medium">Subjects</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((faculty) => (
            <tr key={faculty.id} className="border-b last:border-0">
              <td className="py-3 pr-3">
                <p className="font-medium">{faculty.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {faculty.detail}
                </p>
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums">
                {faculty.average.toFixed(1)} / 10
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {faculty.responses.toLocaleString("en-IN")}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {faculty.students.toLocaleString("en-IN")}
              </td>
              <td className="py-3 pl-3 text-right tabular-nums">
                {faculty.subjects}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FacultyRatingSources({
  faculty,
  subjects,
}: {
  faculty: FacultyRating[]
  subjects: SubjectFacultyRating[]
}) {
  const [facultyId, setFacultyId] = useState(faculty[0]?.id ?? "")
  const selectedFacultyId = faculty.some((entry) => entry.id === facultyId)
    ? facultyId
    : (faculty[0]?.id ?? "")
  const selectedFaculty = faculty.find(
    (entry) => entry.id === selectedFacultyId
  )
  const sources = subjects
    .map((subject) => {
      const rating = subject.faculty.find(
        (entry) => entry.id === selectedFacultyId
      )
      return rating ? { subject, rating } : null
    })
    .filter(
      (
        source
      ): source is { subject: SubjectFacultyRating; rating: FacultyRating } =>
        source !== null
    )
    .sort((first, second) => second.rating.responses - first.rating.responses)

  if (!selectedFaculty || !faculty.length) return <EmptyChart />

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Faculty member</p>
          <Select
            value={selectedFacultyId}
            onValueChange={(value) => setFacultyId(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculty.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.label} · {entry.detail}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <MiniStat
            label="Average"
            value={`${selectedFaculty.average.toFixed(1)} / 10`}
          />
          <MiniStat label="Subjects" value={String(sources.length)} />
          <MiniStat
            label="Responses"
            value={selectedFaculty.responses.toLocaleString("en-IN")}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-muted/35 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Subject source</th>
              <th className="px-3 py-2.5 text-right font-medium">Rating</th>
              <th className="px-3 py-2.5 text-right font-medium">Responses</th>
              <th className="px-3 py-2.5 text-right font-medium">Students</th>
              <th className="px-3 py-2.5 text-right font-medium">Divisions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(({ subject, rating }) => (
              <tr key={subject.id} className="border-t last:border-b-0">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{subject.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {subject.detail}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-medium tabular-nums">
                  {rating.average.toFixed(1)} / 10
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {rating.responses.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {rating.students.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {rating.divisions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Each row shows the subject-level feedback contributing to this faculty
        rating in the active analytics scope.
      </p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-right">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function SubjectDetailTable({ data }: { data: SubjectRating[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr>
            <th className="px-0 py-3 font-medium">Subject</th>
            <th className="px-3 py-3 text-right font-medium">Lecture</th>
            <th className="px-3 py-3 text-right font-medium">Lab</th>
            <th className="px-3 py-3 text-right font-medium">Overall</th>
            <th className="px-3 py-3 text-right font-medium">Responses</th>
            <th className="px-0 py-3 text-right font-medium">Faculty</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((subject) => (
            <tr key={subject.id} className="border-b last:border-0">
              <td className="py-3 pr-3">
                <p className="font-medium">{subject.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subject.detail}
                </p>
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums">
                {subject.lecture?.toFixed(1) ?? "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums">
                {subject.lab?.toFixed(1) ?? "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono font-medium tabular-nums">
                {subject.overall.toFixed(1)} / 10
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {subject.responses.toLocaleString("en-IN")}
              </td>
              <td className="py-3 pl-3 text-right tabular-nums">
                {subject.faculties}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BatchDetailTable({ data }: { data: BatchRating[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr>
            <th className="px-0 py-3 font-medium">Batch</th>
            <th className="px-3 py-3 text-right font-medium">Average</th>
            <th className="px-3 py-3 text-right font-medium">Responses</th>
            <th className="px-0 py-3 text-right font-medium">Students</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((batch) => (
            <tr key={batch.id} className="border-b last:border-0">
              <td className="py-3 pr-3">
                <p className="font-medium">{batch.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {batch.detail}
                </p>
              </td>
              <td className="px-3 py-3 text-right font-mono font-medium tabular-nums">
                {batch.average.toFixed(1)} / 10
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {batch.responses.toLocaleString("en-IN")}
              </td>
              <td className="py-3 pl-3 text-right tabular-nums">
                {batch.students.toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AnalyticsWorkspace({ data }: { data: AnalyticsWorkspaceData }) {
  const strongestSubject = data.subjects[0]
  const opportunitySubject = data.subjects.at(-1)
  const strongestFaculty = data.faculty[0]

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <InsightTile
          label="Highest subject signal"
          value={strongestSubject?.label ?? "No ratings yet"}
          detail={
            strongestSubject
              ? `${strongestSubject.overall.toFixed(1)} / 10 · ${strongestSubject.responses.toLocaleString("en-IN")} responses`
              : "Submitted feedback will appear here"
          }
          tone="primary"
        />
        <InsightTile
          label="Focus opportunity"
          value={opportunitySubject?.label ?? "No ratings yet"}
          detail={
            opportunitySubject
              ? `${opportunitySubject.overall.toFixed(1)} / 10 · Review the underlying feedback context`
              : "Submitted feedback will appear here"
          }
          tone="amber"
        />
        <InsightTile
          label="Leading faculty signal"
          value={strongestFaculty?.label ?? "No ratings yet"}
          detail={
            strongestFaculty
              ? `${strongestFaculty.average.toFixed(1)} / 10 · ${strongestFaculty.subjects} subjects evaluated`
              : "Submitted feedback will appear here"
          }
          tone="slate"
        />
      </div>

      <Tabs
        defaultValue="overview"
        className="gap-0 overflow-hidden rounded-2xl border bg-card shadow-sm"
      >
        <div className="overflow-x-auto border-b bg-muted/30 p-2">
          <TabsList className="min-w-max bg-transparent p-0">
            <TabsTrigger value="overview" className="h-10 px-4">
              <ChartLineUpIcon className="size-4" />
              Performance overview
            </TabsTrigger>
            <TabsTrigger value="academic" className="h-10 px-4">
              <ChartBarIcon className="size-4" />
              Academic groups
            </TabsTrigger>
            <TabsTrigger value="subjects" className="h-10 px-4">
              <BookOpenIcon className="size-4" />
              Subjects & ratings
            </TabsTrigger>
            <TabsTrigger value="performance" className="h-10 px-4">
              <UsersThreeIcon className="size-4" />
              Faculty performance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="m-0 space-y-5 p-4 sm:p-5">
          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Question category signals"
              description="See which parts of the learning experience students score most and least favourably."
            >
              <CategorySignalChart data={data.categories} />
            </ChartCard>
            <ChartCard
              title="Subject ratings comparison"
              description="Lecture and lab feedback stay separate, so practical and theory delivery remain comparable."
            >
              <SubjectRatingsChart data={data.subjects} />
            </ChartCard>
          </section>
        </TabsContent>

        <TabsContent value="academic" className="m-0 space-y-5 p-4 sm:p-5">
          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Department performance by academic year"
              description="Average rating for each department across the available academic years."
            >
              <MultiYearComparisonChart
                rows={data.departments}
                years={data.years}
              />
            </ChartCard>
            <ChartCard
              title="Semester performance by academic year"
              description="Compare the same semester across academic years."
            >
              <MultiYearComparisonChart
                rows={data.semesters}
                years={data.years}
              />
            </ChartCard>
            <ChartCard
              title="Division performance by academic year"
              description="Division-level score comparison for the selected scope."
            >
              <MultiYearComparisonChart
                rows={data.divisions}
                years={data.years}
              />
            </ChartCard>
            <ChartCard
              title="Batch performance comparison"
              description="Ratings for each academic division and student batch."
            >
              <RankingChart data={data.batches} />
            </ChartCard>
          </section>
          <ChartCard
            title="Batch detail"
            description="Response volume and the number of unique students are shown alongside each batch score."
          >
            <BatchDetailTable data={data.batches} />
          </ChartCard>
        </TabsContent>

        <TabsContent value="subjects" className="m-0 space-y-5 p-4 sm:p-5">
          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Subject ratings comparison"
              description="Lecture and lab averages are shown independently on the 10-point scale."
            >
              <SubjectRatingsChart data={data.subjects} />
            </ChartCard>
            <ChartCard
              title="Subject & faculty performance"
              description="Compare faculty teaching the selected subject against its overall benchmark."
            >
              <FacultyForSubjectChart data={data.subjectFaculty} />
            </ChartCard>
          </section>
          <ChartCard
            title="Subject detail"
            description="The full rating picture for every subject in the selected academic scope."
          >
            <SubjectDetailTable data={data.subjects} />
          </ChartCard>
        </TabsContent>

        <TabsContent value="performance" className="m-0 space-y-5 p-4 sm:p-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(26rem,1.15fr)]">
            <ChartCard
              title="Faculty performance rankings"
              description="Ranked by average student rating within the selected filters."
            >
              <RankingChart data={data.faculty} />
            </ChartCard>
            <ChartCard
              title="Faculty detail"
              description="Response volume, evaluated students, and subject coverage behind each score."
            >
              <FacultyTrendTable data={data.faculty} />
            </ChartCard>
          </section>
          <ChartCard
            title="Where a faculty rating comes from"
            description="Trace each faculty score back to its contributing subjects, response volume, students, and divisions."
          >
            <FacultyRatingSources
              faculty={data.faculty}
              subjects={data.subjectFaculty}
            />
          </ChartCard>
        </TabsContent>
      </Tabs>
    </section>
  )
}

function InsightTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: "primary" | "amber" | "slate"
}) {
  const tones = {
    primary: "border-primary/20 bg-primary/5",
    amber: "border-amber-500/25 bg-amber-500/5",
    slate: "border-border bg-muted/35",
  }

  return (
    <Card className={tones[tone]}>
      <CardContent className="p-5">
        <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-2 truncate text-lg font-semibold tracking-tight">
          {value}
        </p>
        <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
          {detail}
        </p>
      </CardContent>
    </Card>
  )
}
