import type { ComponentType } from "react"
import {
  ClockIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactWorkspace } from "@/components/contact/contact-workspace"
import { PublicFooter } from "@/components/public-footer"
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

const details = [
  {
    icon: EnvelopeSimpleIcon,
    label: "Email",
    value: "feedback_ce@ldrp.ac.in",
    href: "mailto:feedback_ce@ldrp.ac.in",
  },
  {
    icon: MapPinIcon,
    label: "Location",
    value: "LDRP Institute of Technology and Research, Gandhinagar",
    href: "https://maps.app.goo.gl/6Dh75Kw8tDKk7WTU7",
  },
  {
    icon: ClockIcon,
    label: "Response time",
    value: "Usually within one business day",
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-svh bg-muted/30">
      <PublicHeader />

      <section className="mx-auto grid w-full gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.85fr_1.15fr] lg:gap-10">
        <div className="flex flex-col justify-between">
          <div>
            <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {"// contact"}
            </p>
            <Badge
              variant="secondary"
              className="mt-4 gap-1.5 border-border/60 px-3 py-1 shadow-sm"
            >
              <SparkleIcon weight="fill" className="size-3.5 text-primary" />
              We would love to hear from you
            </Badge>
            <h1 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-5xl md:text-6xl">
              Start a{" "}
              <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                conversation.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Questions about Reflectify, feedback on the platform, or an idea
              worth sharing? Send us a note and we will point you in the right
              direction.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {details.map((detail) => (
              <ContactDetail key={detail.label} {...detail} />
            ))}
          </div>
        </div>

        <Card className="shadow-lg shadow-primary/5">
          <CardHeader>
            <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {"// send a message"}
            </p>
            <CardTitle className="mt-2 text-xl">Send a message</CardTitle>
            <CardDescription>
              Your message is delivered directly to the Reflectify team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactWorkspace />
          </CardContent>
        </Card>
      </section>

      <PublicFooter />
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
        <p className="font-mono text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
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
      <Card className="p-0 transition-colors hover:border-primary/25 hover:bg-muted/50">
        {content}
      </Card>
    </a>
  ) : (
    <Card className="p-0">{content}</Card>
  )
}
