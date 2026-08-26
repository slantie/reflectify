import Link from "next/link"
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  DatabaseIcon,
  FileArrowUpIcon,
  GithubLogoIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr"

import { PublicFooter } from "@/components/public-footer"
import { PublicHeader } from "@/components/public-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "Documentation | Reflectify",
  description:
    "Learn how Reflectify's academic feedback workflow fits together.",
}

const guides = [
  {
    icon: DatabaseIcon,
    title: "Set up academic data",
    description:
      "Create academic years, colleges, departments, semesters, divisions, subjects, faculty, and teaching allocations.",
    steps: [
      "Add the academic structure",
      "Create subject and faculty records",
      "Confirm teaching allocations",
    ],
  },
  {
    icon: FileArrowUpIcon,
    title: "Upload the Faculty Matrix",
    description:
      "Validate the faculty matrix before it becomes part of the workspace. The upload also generates division timetables.",
    steps: [
      "Choose year, semester run, and department",
      "Review parser warnings",
      "Use the generated timetable in Schedule",
    ],
  },
  {
    icon: ClipboardTextIcon,
    title: "Run a feedback cycle",
    description:
      "Create the teaching groups, build questions, upload students, and activate a reviewed feedback form.",
    steps: [
      "Create the form",
      "Manage questions and students",
      "Activate and monitor responses",
    ],
  },
  {
    icon: ChartLineUpIcon,
    title: "Understand the results",
    description:
      "Use the analytics workspace to explore response patterns across academic groups, subjects, and faculty.",
    steps: [
      "Start from overview metrics",
      "Filter to the academic group",
      "Compare trends and scores",
    ],
  },
]

const quickstart = [
  {
    title: "Shape the structure",
    description:
      "Enter academic years, departments, subjects, faculty, and allocations once — everything downstream reuses it.",
  },
  {
    title: "Upload your workbook",
    description:
      "Validate the Faculty Matrix spreadsheet and generate division timetables in the same pass.",
  },
  {
    title: "Collect and act",
    description:
      "Activate a feedback form within its window, then read patterns in Analytics.",
  },
]

export default function DocsPage() {
  return (
    <main className="min-h-svh bg-muted/30">
      <PublicHeader />

      <section className="mx-auto w-full px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {"// documentation"}
          </p>
          <Badge
            variant="secondary"
            className="mt-4 gap-1.5 border-border/60 px-3 py-1 shadow-sm"
          >
            <BookOpenTextIcon weight="fill" className="size-3.5 text-primary" />
            Reflectify guide
          </Badge>
          <h1 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-5xl md:text-6xl">
            A clear path from academic data to{" "}
            <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
              useful feedback.
            </span>
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Reflectify keeps the feedback workflow deliberate: establish the
            teaching context once, collect responses securely, then use the
            results to guide action.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {quickstart.map((item, index) => (
            <div
              key={item.title}
              className="relative rounded-xl border bg-card p-6 transition-colors hover:border-primary/25"
            >
              <span className="font-mono text-5xl font-semibold text-muted-foreground/40 tabular-nums">
                0{index + 1}
              </span>
              <p className="mt-4 font-semibold">{item.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {"// module guides"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Walkthroughs for every stage.
            </h2>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon
            return (
              <Card
                key={guide.title}
                className="shadow-sm transition-colors hover:border-primary/25"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" weight="fill" />
                    </div>
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                  </div>
                  <CardDescription className="leading-6">
                    {guide.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="divide-y">
                    {guide.steps.map((step, stepIndex) => (
                      <li
                        key={step}
                        className="flex items-center gap-3 py-2.5 text-sm leading-6 first:pt-0 last:pb-0"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-medium text-muted-foreground tabular-nums">
                          {stepIndex + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Card className="border-primary/15 bg-primary/5 shadow-sm">
            <CardContent className="flex h-full flex-col justify-between gap-5 p-6 sm:p-8">
              <div>
                <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  {"// support"}
                </p>
                <p className="mt-2 font-medium">
                  Need help with a specific workflow?
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Send the team a message with the module and issue you are
                  working through.
                </p>
              </div>
              <Button className="w-fit" render={<Link href="/contact" />}>
                Contact the team
                <ArrowRightIcon weight="bold" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="flex h-full flex-col justify-between gap-5 p-6 sm:p-8">
              <div>
                <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  {"// open source"}
                </p>
                <p className="mt-2 font-medium">One source of truth</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Reflectify&apos;s application, deployment configuration, and
                  documentation live in one repository.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-fit"
                render={
                  <a
                    href="https://github.com/slantie/reflectify"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <GithubLogoIcon weight="fill" />
                github.com/slantie/reflectify
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex items-start gap-2 rounded-xl border bg-background/60 p-4 text-xs leading-5 text-muted-foreground">
          <ShieldCheckIcon
            className="mt-0.5 size-4 shrink-0 text-primary"
            weight="fill"
          />
          Feedback links are individual and responses are handled within the
          configured feedback window.
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
