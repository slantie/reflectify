import Image from "next/image"
import { EyeIcon } from "@phosphor-icons/react/dist/ssr"

import { StudentFeedbackForm } from "@/components/feedback/student-feedback-form"
import { PublicHeader } from "@/components/public-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Student feedback preview | Reflectify",
  description: "Preview the student feedback experience.",
}

const previewQuestions = [
  {
    id: "preview-teaching",
    text: "How effectively did the faculty member explain the course material?",
    type: "rating",
    isRequired: true,
    category: "Teaching and learning",
    faculty: "JJK",
    subject: "CT704A · Distributed Systems",
    batch: "-",
  },
  {
    id: "preview-engagement",
    text: "How well did the faculty member encourage participation and discussion?",
    type: "rating",
    isRequired: true,
    category: "Teaching and learning",
    faculty: "JJK",
    subject: "CT704A · Distributed Systems",
    batch: "-",
  },
  {
    id: "preview-improvement",
    text: "What is one thing that would improve this course experience?",
    type: "text",
    isRequired: false,
    category: "Your perspective",
    faculty: "JJK",
    subject: "CT704A · Distributed Systems",
    batch: "-",
  },
]

export default function FeedbackPreviewPage() {
  return (
    <div className="min-h-svh bg-muted/30">
      <PublicHeader />
      <main className="px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-center sm:mb-7">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border sm:size-11">
              <Image
                src="/reflectify-logo.svg"
                alt="Reflectify"
                width={44}
                height={44}
                priority
                className="size-8 sm:size-9"
              />
            </div>
            <Badge variant="secondary" className="mt-4 gap-1.5">
              <EyeIcon weight="fill" />
              Preview mode · no response will be saved
            </Badge>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-3xl">
              Student feedback experience
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A preview of the form students receive through their unique
              feedback link.
            </p>
          </div>
          <Card className="mb-4 shadow-sm sm:mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge>Anonymous feedback</Badge>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Students choose a score from 1 to 10 and can add context in
                    their own words.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center sm:min-w-52 sm:gap-3">
                  <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                    <p className="text-lg font-semibold tabular-nums">3</p>
                    <p className="text-xs text-muted-foreground">questions</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                    <p className="text-sm font-semibold">1–10</p>
                    <p className="text-xs text-muted-foreground">
                      rating scale
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <StudentFeedbackForm
            accessToken="preview"
            questions={previewQuestions}
            availableBatches={[]}
            preview
          />
        </div>
      </main>
    </div>
  )
}
