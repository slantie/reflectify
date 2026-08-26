import Link from "next/link"
import type { ComponentType } from "react"
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  CalendarCheckIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  FileArrowUpIcon,
  GraduationCapIcon,
  LightningIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { PublicFooter } from "@/components/public-footer"
import { PublicHeader } from "@/components/public-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-[radial-gradient(circle_at_top_right,oklch(0.9_0.1_240/.35),transparent_32rem)]">
      <PublicHeader />

      <main className="flex-1">
        <Hero />
        <Showcase />
        <StatsBand />
        <FeatureBento />
        <Workflow />
        <CtaBand />
      </main>

      <PublicFooter />
    </div>
  )
}

function Hero() {
  return (
    <section className="mx-auto w-full px-5 pt-14 pb-16 sm:px-8 md:pt-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-balance sm:text-6xl md:text-7xl">
          Turn every class into a{" "}
          <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
            clearer conversation.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          Reflectify brings faculty feedback, academic structures, and
          meaningful insight into one calm workspace — so institutions act on
          patterns instead of collecting paperwork.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/login" />} size="lg">
            Open workspace <ArrowRightIcon weight="bold" />
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/docs" />}>
            <BookOpenTextIcon weight="fill" />
            Explore the docs
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
          <span>Trusted across departments</span>
          <span className="hidden h-3 w-px bg-border sm:block" />
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-4 text-primary" weight="fill" />
            Private by design
          </span>
          <span className="flex items-center gap-1.5">
            <LightningIcon className="size-4 text-primary" weight="fill" />
            Excel-native uploads
          </span>
        </div>
      </div>
    </section>
  )
}

function Showcase() {
  return (
    <section
      aria-hidden
      className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8"
    >
      <div className="relative rounded-2xl border border-border/70 p-2 shadow-2xl shadow-primary/10">
        <div className="overflow-hidden rounded-xl border bg-background/80 backdrop-blur">
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-yellow-400/70" />
              <span className="size-2.5 rounded-full bg-green-400/70" />
              <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
                reflectify / analytics / overview
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-[13rem_1fr]">
            <div className="hidden flex-col gap-1 border-r bg-muted/40 p-3 sm:flex">
              {[
                UsersThreeIcon,
                FileArrowUpIcon,
                CalendarCheckIcon,
                ChartLineUpIcon,
                ShieldCheckIcon,
              ].map((Icon, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                    index === 3
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" weight="fill" />
                  <span className="truncate">
                    {
                      (
                        [
                          "People",
                          "Uploads",
                          "Schedule",
                          "Analytics",
                          "Security",
                        ] as const
                      )[index]
                    }
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Responses", value: "14.2k", wide: true },
                  { label: "Forms live", value: "23" },
                  { label: "Departments", value: "12" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border bg-card p-3 sm:p-4"
                  >
                    <p className="text-xl font-semibold tracking-tight text-foreground/90 tabular-nums sm:text-2xl">
                      {metric.value}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Response rate</p>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">
                    +18%
                  </span>
                </div>
                <div className="mt-4 flex h-28 items-end gap-2 sm:h-36 sm:gap-3">
                  {[35, 55, 42, 68, 50, 82, 64, 95].map((height, index) => (
                    <div
                      key={index}
                      style={{ height: `${height}%` }}
                      className={`flex-1 rounded-t-md ${
                        index === 7
                          ? "bg-primary"
                          : "bg-primary/15 dark:bg-primary/25"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -top-3 -right-2 hidden rotate-3 items-center gap-2.5 rounded-xl border bg-background p-3 shadow-lg md:flex">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCapIcon className="size-5" weight="fill" />
          </div>
          <div>
            <p className="text-sm font-medium">One academic workspace</p>
            <p className="text-xs text-muted-foreground">
              data → forms → insight
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const stats = [
  { value: "14.2k+", label: "Feedback responses collected" },
  { value: "12+", label: "Departments structured" },
  { value: "300+", label: "Forms managed per cycle" },
  { value: "1", label: "Connected workspace" },
]

function StatsBand() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {"// telemetry"}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BentoTile({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: ComponentType<{ className?: string; weight?: "regular" | "fill" }>
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <Card
      className={`group relative overflow-hidden transition-colors hover:border-primary/25 ${className}`}
    >
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" weight="fill" />
        </div>
        <p className="mt-4 font-semibold">{title}</p>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {children}
      </CardContent>
    </Card>
  )
}

function FeatureBento() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {"// why reflectify"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Everything you need to run feedback properly.
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Stop rebuilding spreadsheets every semester. Reflectify keeps the
          academic context connected from timetable to insight.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-6">
        <BentoTile
          icon={FileArrowUpIcon}
          title="Excel-native uploads"
          description="Bring the faculty matrix and subject sheets you already maintain. Parsers validate before anything commits."
          className="md:col-span-3"
        >
          <div className="mt-auto space-y-2 bg-muted/40 pt-5">
            {[92, 74].map((width, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <CheckCircleIcon
                  className="size-4 shrink-0 text-primary"
                  weight="fill"
                />
                <div
                  style={{ width: `${width}%` }}
                  className="h-1.5 rounded-full bg-foreground/15"
                />
              </div>
            ))}
          </div>
        </BentoTile>

        <BentoTile
          icon={ChartLineUpIcon}
          title="Insight, not just scores"
          description="Explore response patterns across groups, subjects, and faculty with filters that mirror your structure."
          className="md:col-span-3"
        >
          <div className="mt-auto flex h-16 items-end gap-1.5 pt-5">
            {[40, 65, 48, 80, 58, 92, 70].map((height, index) => (
              <div
                key={index}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-t ${
                  index === 5
                    ? "bg-primary"
                    : "bg-primary/15 dark:bg-primary/25"
                }`}
              />
            ))}
          </div>
        </BentoTile>

        <BentoTile
          icon={ShieldCheckIcon}
          title="Private by design"
          description="Individual response links, configured windows, and admin-only analytics keep student voice safe."
          className="md:col-span-2"
        />
        <BentoTile
          icon={CalendarCheckIcon}
          title="Timetable aware"
          description="Uploading the matrix generates division timetables, keeping Schedule and feedback aligned."
          className="md:col-span-2"
        />
        <BentoTile
          icon={UsersThreeIcon}
          title="Role-aware workspaces"
          description="Admins, faculty, and students each get a focused surface with exactly what they need."
          className="md:col-span-2"
        />
      </div>
    </section>
  )
}

const workflow = [
  {
    step: "01",
    title: "Shape academic data",
    description:
      "Years, departments, subjects, faculty, and allocations — entered once.",
  },
  {
    step: "02",
    title: "Upload the faculty matrix",
    description:
      "Validate the workbook and generate division timetables automatically.",
  },
  {
    step: "03",
    title: "Run a feedback cycle",
    description:
      "Build forms, upload students, and activate within a controlled window.",
  },
  {
    step: "04",
    title: "Act on patterns",
    description:
      "Use analytics to compare trends and close the loop with real changes.",
  },
]

function Workflow() {
  return (
    <section id="how-it-works" className="border-y bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {"// workflow"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A deliberate path from data to action.
          </h2>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((item) => (
            <li
              key={item.step}
              className="relative rounded-xl border bg-card p-5 transition-colors hover:border-primary/25"
            >
              <span className="font-mono text-4xl font-semibold text-muted-foreground/40">
                {item.step}
              </span>
              <p className="mt-3 font-semibold">{item.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
      <Card className="relative overflow-hidden border-primary/15 border-transparent bg-gradient-to-br from-primary to-chart-4 shadow-xl shadow-primary/20">
        <CardContent className="relative p-8 sm:p-12">
          <p className="font-mono text-xs font-medium tracking-widest text-primary-foreground/60 uppercase">
            {"// get started"}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-primary-foreground sm:text-4xl">
            Ready to hear every student clearly?
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-primary-foreground/75">
            Sign in to open the workspace, or talk to us about bringing
            Reflectify to your department.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="secondary"
              render={<Link href="/login" />}
            >
              Open workspace <ArrowRightIcon weight="bold" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30! bg-transparent! text-primary-foreground! hover:bg-primary-foreground/10!"
              render={<Link href="/contact" />}
            >
              Talk to the team
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
