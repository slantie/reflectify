import { cn } from "@/lib/utils"

import { Quantize } from "@/components/ui/quantize"

export function Loader({
  className,
  label = "Loading",
}: {
  className?: string
  label?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh w-full items-center justify-center",
        className
      )}
      style={{ "--color-dot": "var(--primary)" } as React.CSSProperties}
    >
      <Quantize aria-label={label} />
    </div>
  )
}
