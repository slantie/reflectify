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
    "Learn how Reflectify’s academic feedback workflow fits together.",
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

export default function DocsPage() {
  return (
    <main className="min-h-svh bg-muted/30">
      <PublicHeader />
      <section className="mx-auto w-full px-4 py-9 sm:px-6 sm:py-12">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="gap-1.5">
            <BookOpenTextIcon weight="fill" />
            Reflectify guide
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
            A clear path from academic data to useful feedback.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            Reflectify keeps the feedback workflow deliberate: establish the
            teaching context once, collect responses securely, then use the
            results to guide action.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guides.map((guide, index) => {
            const Icon = guide.icon
            return (
              <Card key={guide.title} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" weight="fill" />
                    </div>
                    <Badge variant="outline">Step {index + 1}</Badge>
                  </div>
                  <CardTitle className="mt-4">{guide.title}</CardTitle>
                  <CardDescription className="leading-6">
                    {guide.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2.5">
                    {guide.steps.map((step, stepIndex) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 text-sm leading-6"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
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

        <Card className="mt-6 border-primary/15 bg-primary/5 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-medium">Need help with a specific workflow?</p>
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
        <Card className="mt-4 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-medium">One source of truth</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Reflectify’s application, deployment configuration, and
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
        <div className="mt-6 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheckIcon
            className="size-4 shrink-0 text-primary"
            weight="fill"
          />
          Feedback links are individual and responses are handled within the
          configured feedback window.
        </div>
      </section>
    </main>
  )
}
