import { cn } from "@/lib/utils"

import styles from "./quantize.module.css"

const CELLS = Array.from({ length: 25 }, (_, i) => i)

export interface QuantizeProps {
  /** Dot diameter in px. */
  dotSize?: number
  /** Gap between dots in px. */
  cellPadding?: number
  /** Animation speed multiplier (1 = default). */
  speed?: number
  className?: string
  style?: React.CSSProperties
  "aria-label"?: string
}

export function Quantize({
  dotSize = 4,
  cellPadding = 1.5,
  speed = 1,
  className,
  style,
  "aria-label": ariaLabel = "Loading",
}: QuantizeProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn(styles.grid, className)}
      style={
        {
          ...style,
          "--q-dot": `${dotSize}px`,
          "--q-cycle": `${2.4 / Math.max(speed, 0.1)}s`,
          gridTemplateColumns: `repeat(5, ${dotSize}px)`,
          gap: `${cellPadding}px`,
        } as React.CSSProperties
      }
    >
      {CELLS.map((cell) => (
        <span key={cell} className={cn(styles.dot, styles[`c${cell}`])} />
      ))}
    </div>
  )
}
