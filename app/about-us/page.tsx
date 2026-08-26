import Link from "next/link"
import Image from "next/image"
import type { ComponentType } from "react"
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  QuotesIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { PublicFooter } from "@/components/public-footer"
import { PublicHeader } from "@/components/public-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "About us | Reflectify",
  description:
    "Meet the people building a clearer academic feedback experience.",
}

const team = [
  {
    name: "Kandarp Gajjar",
    bio: "Built the backend that powers Reflectify — data models, feedback workflows, and the services behind every response.",
    image: "/team/kandarp-gajjar.jpeg",
    imagePosition: "object-center",
    github: "https://github.com/slantie/",
    linkedin: "https://www.linkedin.com/in/kandarpgajjar",
    email: "kandarp_22091@ldrp.ac.in",
  },
  {
    name: "Harsh Dodiya",
    bio: "Owns the system architecture and deployment. Keeps the platform dependable, scalable, and shipping smoothly.",
    image: "/team/harsh-dodiya.jpg",
    imagePosition: "object-[center_30%]",
    github: "https://github.com/HarshDodiya1/",
    linkedin: "https://www.linkedin.com/in/dodiyaharsh",
    email: "harsh_22087@ldrp.ac.in",
  },
  {
    name: "Parin Dave",
    bio: "Crafted the Reflectify UI — the interfaces students and faculty use every day, from feedback forms to analytics views.",
    image: "/team/parin-dave.png",
    imagePosition: "object-[center_22%]",
    github: "https://github.com/ParinDave/",
    linkedin: "https://www.linkedin.com/in/parin-dave-800938267/",
    email: "parin_22088@ldrp.ac.in",
  },
]

const facts = [
  { value: "3", label: "Builders" },
  { value: "2025", label: "First cycle" },
  { value: "LDRP ITR", label: "Home institute" },
]

const principles = [
  {
    icon: UsersThreeIcon,
    title: "Student voice",
    description:
      "A focused, mobile-friendly response experience that respects students' time.",
  },
  {
    icon: ChartLineUpIcon,
    title: "Useful insight",
    description:
      "Structured feedback that helps academic teams identify patterns, not just collect scores.",
  },
  {
    icon: CheckCircleIcon,
    title: "Operational clarity",
    description:
      "One connected workflow for academic data, forms, timetables, and follow-through.",
  },
]

export default function AboutUsPage() {
  return (
    <main className="min-h-svh overflow-hidden bg-muted/30">
      <PublicHeader />

      <section className="relative mx-auto w-full px-4 py-12 sm:px-6 sm:py-16">
        <div
          aria-hidden
          className="absolute -top-32 -right-40 size-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute top-80 -left-48 size-96 rounded-full bg-amber-300/15 blur-3xl"
        />

        <div className="relative">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {"// about us"}
          </p>
          <Badge
            variant="secondary"
            className="mt-4 gap-1.5 border-border/60 px-3 py-1 shadow-sm"
          >
            <SparkleIcon weight="fill" className="size-3.5 text-primary" />
            Built at LDRP Institute of Technology and Research
          </Badge>
          <h1 className="mt-6 max-w-4xl text-4xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            Better feedback begins with a{" "}
            <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
              clearer system.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Reflectify is an academic feedback workspace built to make student
            voice easier to collect, safer to manage, and more useful to act on.
          </p>

          <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
            {facts.map((fact) => (
              <div key={fact.label}>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {fact.value}
                </p>
                <p className="mt-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-background/70">
        <div className="mx-auto w-full px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {"// what we believe"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Principles before features.
            </h2>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {principles.map((principle) => (
              <Principle key={principle.title} {...principle} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {"// the people behind it"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            A small team with a practical point of view.
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            We believe academic tools should feel considered: straightforward
            for administrators and frictionless for students.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {team.map((member) => (
            <Card key={member.name} className="shadow-sm">
              <CardContent className="p-5">
                <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(min-width: 768px) 300px, 100vw"
                    className={`object-cover ${member.imagePosition}`}
                  />
                </div>
                <div className="mt-5 text-center">
                  <p className="font-semibold">{member.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Full Stack Developer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {member.bio}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`${member.name} on GitHub`}
                      title={`${member.name} on GitHub`}
                      render={
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <GithubLogoIcon />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`${member.name} on LinkedIn`}
                      title={`${member.name} on LinkedIn`}
                      render={
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <LinkedinLogoIcon />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Email ${member.name}`}
                      title={`Email ${member.name}`}
                      render={<a href={`mailto:${member.email}`} />}
                    >
                      <EnvelopeSimpleIcon />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full px-4 pb-16 sm:px-6">
        <Card className="overflow-hidden border-primary/15 border-transparent bg-gradient-to-br from-primary to-chart-4 shadow-lg shadow-primary/15">
          <CardContent className="grid gap-6 p-6 sm:p-10 md:grid-cols-[auto_1fr_auto] md:items-center">
            <QuotesIcon
              weight="fill"
              className="hidden size-10 text-primary-foreground/40 md:block"
            />
            <div>
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance text-primary-foreground sm:text-3xl">
                Transparency is not a feature. It is the foundation.
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-primary-foreground/75">
                We are building a feedback process where students can be heard
                and academic teams can respond with clarity.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="w-fit"
              render={<Link href="/login" />}
            >
              Open the workspace
              <ArrowRightIcon weight="bold" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <PublicFooter />
    </main>
  )
}

function Principle({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string; weight?: "regular" | "fill" }>
  title: string
  description: string
}) {
  return (
    <Card className="border-primary/10 bg-background/80 shadow-sm transition-colors hover:border-primary/25">
      <CardContent className="p-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" weight="fill" />
        </div>
        <p className="mt-4 font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
