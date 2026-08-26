import type { ComponentType } from "react"
import {
  ClockIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactWorkspace } from "@/components/contact/contact-workspace"
import { PublicHeader } from "@/components/public-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "Contact | Reflectify",
  description: "Get in touch with the Reflectify team.",
}

export default function ContactPage() {
  return (
    <main className="min-h-svh bg-muted/30">
      <PublicHeader />
      <section className="mx-auto grid w-full gap-6 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-8">
        <div className="flex flex-col justify-between">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <SparkleIcon weight="fill" />
              We would love to hear from you
            </Badge>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              Start a conversation.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Questions about Reflectify, feedback on the platform, or an idea
              worth sharing? Send us a note and we will point you in the right
              direction.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <ContactDetail
              icon={EnvelopeSimpleIcon}
              label="Email"
              value="feedback_ce@ldrp.ac.in"
              href="mailto:feedback_ce@ldrp.ac.in"
            />
            <ContactDetail
              icon={MapPinIcon}
              label="Location"
              value="LDRP Institute of Technology and Research, Gandhinagar"
              href="https://maps.app.goo.gl/6Dh75Kw8tDKk7WTU7"
            />
            <ContactDetail
              icon={ClockIcon}
              label="Response time"
              value="Usually within one business day"
            />
          </div>
        </div>
        <Card className="shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
            <CardDescription>
              Your message is delivered directly to the Reflectify team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactWorkspace />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function ContactDetail({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: ComponentType<{ className?: string; weight?: "regular" | "fill" }>
  label: string
  value: string
  href?: string
}) {
  const content = (
    <CardContent className="flex gap-3 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" weight="fill" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm leading-5 font-medium">{value}</p>
      </div>
    </CardContent>
  )

  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card className="p-0 transition-colors hover:bg-muted/50">{content}</Card>
    </a>
  ) : (
    <Card className="p-0">{content}</Card>
  )
}
