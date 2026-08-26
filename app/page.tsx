import Link from "next/link"
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { PublicHeader } from "@/components/public-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_right,oklch(0.9_0.1_240/.35),transparent_32rem)]">
      <PublicHeader />
      <main className="mx-auto grid w-full gap-12 px-5 pt-12 pb-20 md:grid-cols-[1.1fr_.9fr] md:px-8 md:pt-24">
        <section className="flex flex-col items-start justify-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <SparkleIcon weight="fill" /> Built for academic clarity
          </Badge>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.045em] text-balance md:text-7xl">
            Turn every class into a clearer conversation.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Reflectify brings faculty feedback, academic structures, and
            meaningful insight into one calm workspace.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button render={<Link href="/login" />} size="lg">
              Open workspace <ArrowRightIcon weight="bold" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<a href="#how-it-works" />}
            >
              How it works
            </Button>
          </div>
        </section>
        <section className="relative">
          <Card className="overflow-hidden border-primary/15 bg-card/90 shadow-2xl shadow-primary/10 backdrop-blur">
            <CardContent className="space-y-7 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Academic overview
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    Feedback that moves forward
                  </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ChartLineUpIcon className="size-6" weight="fill" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Connected records"
                  value="14.2k"
                  note="feedback responses"
                />
                <Metric
                  label="Faculty matrix"
                  value="One view"
                  note="structured by allocation"
                />
              </div>
              <div
                id="how-it-works"
                className="rounded-xl border bg-muted/45 p-4"
              >
                <p className="text-sm font-medium">A deliberate workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className="size-4 text-primary"
                      weight="fill"
                    />{" "}
                    Shape academic data once
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className="size-4 text-primary"
                      weight="fill"
                    />{" "}
                    Gather feedback securely
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className="size-4 text-primary"
                      weight="fill"
                    />{" "}
                    Act on the patterns that matter
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <div className="absolute -right-3 -bottom-5 hidden rounded-2xl border bg-background p-4 shadow-lg md:flex md:items-center md:gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCapIcon weight="fill" />
            </div>
            <div>
              <p className="text-sm font-medium">One academic workspace</p>
              <p className="text-xs text-muted-foreground">
                built for your institution
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}
