"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react"

import {
  submitFeedbackResponse,
  type FeedbackResponseState,
} from "@/app/actions/feedback-response"
import { useActionToast } from "@/components/feedback/use-action-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Question = {
  id: string
  text: string
  type: string
  isRequired: boolean
  category: string
  faculty: string
  subject: string
  batch: string
}

const initialState: FeedbackResponseState = {}

function isGeneralQuestion(question: Question) {
  return !question.batch || question.batch === "None" || question.batch === "-"
}

export function StudentFeedbackForm({
  accessToken,
  questions,
  availableBatches,
  suggestedBatch,
  preview = false,
}: {
  accessToken: string
  questions: Question[]
  availableBatches: string[]
  suggestedBatch?: string
  preview?: boolean
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedBatches, setSelectedBatches] = useState<string[]>(
    suggestedBatch ? [suggestedBatch] : []
  )
  const [batchesConfirmed, setBatchesConfirmed] = useState(
    availableBatches.length === 0
  )
  const [state, formAction, pending] = useActionState(
    submitFeedbackResponse,
    initialState
  )
  useActionToast(state)

  useEffect(() => {
    if (state.success) router.replace("/feedback/thank-you")
  }, [router, state.success])

  const activeQuestions = questions.filter(
    (question) =>
      isGeneralQuestion(question) || selectedBatches.includes(question.batch)
  )
  const answeredCount = activeQuestions.filter(
    (question) => answers[question.id]
  ).length
  const categoryGroups = activeQuestions.reduce<
    { category: string; questions: Question[] }[]
  >((groups, question) => {
    const group = groups.find((item) => item.category === question.category)
    if (group) group.questions.push(question)
    else groups.push({ category: question.category, questions: [question] })
    return groups
  }, [])

  if (state.success) {
    return (
      <Card className="shadow-sm">
        <CardContent className="px-6 py-10 text-center sm:py-12">
          <CheckCircleIcon
            className="mx-auto size-11 text-primary"
            weight="fill"
          />
          <h2 className="mt-4 text-xl font-semibold">Feedback received</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {state.success}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (availableBatches.length > 0 && !batchesConfirmed) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-5 sm:p-8">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-medium text-primary">Lab feedback</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Select your batch or electives
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Choose every batch you attend. We will show the relevant lab
              questions along with your common feedback questions.
            </p>
          </div>

          <div className="mx-auto mt-7 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
            {availableBatches.map((batch) => {
              const selected = selectedBatches.includes(batch)
              return (
                <Label
                  key={batch}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-base font-medium transition-colors hover:border-primary/50 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() =>
                      setSelectedBatches((current) =>
                        current.includes(batch)
                          ? current.filter((value) => value !== batch)
                          : [...current, batch]
                      )
                    }
                  />
                  Batch {batch}
                </Label>
              )
            })}
          </div>

          <div className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {selectedBatches.length > 0
                ? `Selected: ${selectedBatches.join(", ")}`
                : "Select at least one batch to continue."}
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={selectedBatches.length === 0}
              onClick={() => setBatchesConfirmed(true)}
            >
              Continue to feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form
      action={formAction}
      className="space-y-4 sm:space-y-5"
      onSubmit={preview ? (event) => event.preventDefault() : undefined}
    >
      <input type="hidden" name="accessToken" value={accessToken} />
      <input
        type="hidden"
        name="selectedBatches"
        value={JSON.stringify(selectedBatches)}
      />
      {state.error && (
        <Alert variant="destructive">
          <WarningCircleIcon weight="fill" />
          <AlertTitle>Feedback was not submitted</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Card className="sticky top-2 z-10 shadow-sm">
        <CardContent className="flex items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-4">
          <div>
            <p className="text-sm font-medium">Your progress</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {answeredCount} of {activeQuestions.length} questions answered
            </p>
          </div>
          <div className="flex items-center gap-3">
            {availableBatches.length > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setBatchesConfirmed(false)}
              >
                Batches
              </Button>
            ) : null}
            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted sm:w-40">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${activeQuestions.length ? (answeredCount / activeQuestions.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {categoryGroups.map((group) => (
        <section key={group.category} className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 px-1 pt-2">
            <span className="h-px flex-1 bg-border" />
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              {group.category}
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>

          {group.questions.map((question) => {
            const index = activeQuestions.findIndex(
              (item) => item.id === question.id
            )
            return (
              <Card key={question.id} className="shadow-sm">
                <CardContent className="p-3.5 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-4">
                      <div>
                        <Label className="block text-base leading-6 sm:text-lg">
                          {question.text}
                          {question.isRequired ? (
                            <span className="text-destructive"> *</span>
                          ) : null}
                        </Label>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {question.faculty} · {question.subject}
                        </p>
                      </div>

                      {question.type.toLowerCase() === "rating" ? (
                        <div className="mx-auto w-full max-w-2xl rounded-xl border bg-muted/30 p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium">
                                Choose a score
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                1 is poor · 10 is excellent
                              </p>
                            </div>
                            <div className="rounded-lg bg-background px-3 py-2 text-right shadow-sm ring-1 ring-border">
                              <p className="text-lg leading-none font-semibold text-primary tabular-nums">
                                {answers[question.id] ?? "—"}
                                <span className="ml-1 text-xs font-medium text-muted-foreground">
                                  / 10
                                </span>
                              </p>
                              <p className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                Your score
                              </p>
                            </div>
                          </div>
                          <div
                            className="mt-5 grid grid-cols-10 gap-px overflow-hidden rounded-lg border bg-border"
                            role="radiogroup"
                            aria-label={`Rating for: ${question.text}`}
                          >
                            {Array.from(
                              { length: 10 },
                              (_, index) => index + 1
                            ).map((rating) => {
                              const selected =
                                answers[question.id] === String(rating)
                              return (
                                <Button
                                  key={rating}
                                  type="button"
                                  variant="ghost"
                                  className={`h-12 min-w-0 rounded-none bg-background p-0 text-sm font-semibold text-foreground tabular-nums shadow-none hover:bg-primary/10 sm:h-11 sm:text-base ${
                                    selected
                                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                      : ""
                                  }`}
                                  role="radio"
                                  aria-checked={selected}
                                  aria-label={`${rating} out of 10`}
                                  onClick={() =>
                                    setAnswers((current) => ({
                                      ...current,
                                      [question.id]: String(rating),
                                    }))
                                  }
                                >
                                  {rating}
                                </Button>
                              )
                            })}
                          </div>
                          <p className="mt-3 text-center text-xs text-muted-foreground">
                            {answers[question.id]
                              ? `Your score: ${answers[question.id]} / 10`
                              : "Tap one number to select your score."}
                          </p>
                          <input
                            type="hidden"
                            name={`answer-${question.id}`}
                            value={answers[question.id] ?? ""}
                          />
                        </div>
                      ) : (
                        <Textarea
                          name={`answer-${question.id}`}
                          value={answers[question.id] ?? ""}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: event.target.value,
                            }))
                          }
                          placeholder="Write your response"
                          required={question.isRequired}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      ))}

      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-stretch gap-3 p-4 text-center sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:text-left">
          <p className="text-xs leading-5 text-muted-foreground">
            Required questions are marked with an asterisk. Your response is
            submitted once and cannot be edited.
          </p>
          <Button
            type={preview ? "button" : "submit"}
            size="lg"
            className="w-full sm:w-auto"
            disabled={pending || activeQuestions.length === 0 || preview}
          >
            {preview
              ? "Preview only"
              : pending
                ? "Submitting…"
                : "Submit feedback"}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
