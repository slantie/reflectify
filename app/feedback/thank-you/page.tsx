import Link from "next/link"
import { CheckCircleIcon, HeartIcon } from "@phosphor-icons/react/dist/ssr"

import { PublicHeader } from "@/components/public-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Feedback received | Reflectify",
  description: "Your feedback response has been received.",
}

export default function FeedbackThankYouPage() {
  return (
    <div className="min-h-svh bg-muted/30">
      <PublicHeader />
      <main className="flex min-h-[calc(100svh-4rem)] items-center px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-xl">
          <Card className="overflow-hidden border-primary/15 shadow-lg shadow-primary/10">
            <CardContent className="px-6 py-12 text-center sm:px-12 sm:py-16">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircleIcon className="size-9" weight="fill" />
              </div>
              <Badge variant="secondary" className="mt-6 gap-1.5">
                <HeartIcon weight="fill" />
                Response recorded
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Thank you for your feedback.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                Your response has been securely recorded. It will help the
                academic team understand what is working and where the learning
                experience can improve.
              </p>
              <div className="mt-8 rounded-xl border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                You can safely close this window. Your unique feedback link
                cannot be submitted again.
              </div>
              <Button
                variant="outline"
                className="mt-8"
                render={<Link href="/" />}
              >
                Back to Reflectify
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
