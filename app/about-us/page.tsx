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
  SparkleIcon,
  UsersThreeIcon,
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
  title: "About us | Reflectify",
  description:
    "Meet the people building a clearer academic feedback experience.",
}

const team = [
  {
    name: "Kandarp Gajjar",
    role: "Full-stack developer",
    focus: "Product experience and analytics",
    bio: "Shapes the frontend systems and insight workflows that turn complex academic operations into a calm, useful workspace.",
    image: "/team/kandarp-gajjar.jpeg",
    imagePosition: "object-center",
    github: "https://github.com/slantie/",
    linkedin: "https://www.linkedin.com/in/kandarpgajjar",
    email: "kandarp_22091@ldrp.ac.in",
  },
  {
    name: "Harsh Dodiya",
    role: "Full-stack developer",
    focus: "Backend architecture and reliability",
    bio: "Builds the dependable data and service foundations that support large-scale feedback collection and academic workflows.",
    image: "/team/harsh-dodiya.jpg",
    imagePosition: "object-[center_30%]",
    github: "https://github.com/HarshDodiya1/",
    linkedin: "https://www.linkedin.com/in/dodiyaharsh",
    email: "harsh_22087@ldrp.ac.in",
  },
  {
    name: "Parin Dave",
    role: "Full-stack developer",
    focus: "Data processing and platform systems",
    bio: "Focuses on data infrastructure and the robust processing pipelines behind Reflectify’s academic intelligence.",
    image: "/team/parin-dave.png",
    imagePosition: "object-[center_22%]",
    github: "https://github.com/ParinDave/",
    linkedin: "https://www.linkedin.com/in/parin-dave-800938267/",
    email: "parin_22088@ldrp.ac.in",
  },
]

export default function AboutUsPage() {
  return (
    <main className="min-h-svh overflow-hidden bg-muted/30">
      <PublicHeader />

      <section className="relative mx-auto w-full px-4 py-10 sm:px-6 sm:py-14">
        <div className="absolute -top-32 -right-40 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-80 -left-48 size-96 rounded-full bg-amber-300/15 blur-3xl" />

        <div className="relative">
          <Badge variant="secondary" className="gap-1.5">
            <SparkleIcon weight="fill" />
            Built at LDRP Institute of Technology and Research
          </Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            Better feedback begins with a clearer system.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Reflectify is an academic feedback workspace built to make student
            voice easier to collect, safer to manage, and more useful to act on.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Principle
              icon={UsersThreeIcon}
              title="Student voice"
              description="A focused, mobile-friendly response experience that respects students’ time."
            />
            <Principle
              icon={ChartLineUpIcon}
              title="Useful insight"
              description="Structured feedback that helps academic teams identify patterns, not just collect scores."
            />
            <Principle
              icon={CheckCircleIcon}
              title="Operational clarity"
              description="One connected workflow for academic data, forms, timetables, and follow-through."
            />
          </div>
        </div>
      </section>

      <section className="border-y bg-background/70">
        <div className="mx-auto w-full px-4 py-10 sm:px-6 sm:py-14">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">
              The people behind it
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              A small team with a practical point of view.
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We believe academic tools should feel considered: straightforward
              for administrators and frictionless for students.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {team.map((member) => (
              <Card key={member.name} className="shadow-sm">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className={`object-cover ${member.imagePosition}`}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/70 to-transparent" />
                </div>
                <CardHeader>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription>
                    {member.role} · {member.focus}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="leading-6 text-muted-foreground">
                    {member.bio}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-4 py-10 sm:px-6 sm:py-14">
        <Card className="overflow-hidden border-primary/15 bg-primary text-primary-foreground shadow-lg shadow-primary/15">
          <CardContent className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-medium text-primary-foreground/75">
                Our principle
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Transparency is not a feature. It is the foundation.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-primary-foreground/80">
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
    <Card className="border-primary/10 bg-background/80 shadow-sm">
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
