import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"

export function ModuleMetricCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
}: {
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>
  label: string
  value: number
  detail: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        size="sm"
        className="h-full shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <CardContent className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
            <p className="mt-0.5 text-sm font-medium">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
