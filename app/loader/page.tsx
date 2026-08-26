import type { Metadata } from "next"

import { Quantize } from "@/components/ui/quantize"

export const metadata: Metadata = {
  title: "Loader preview",
  description:
    "Temporary preview of the Quantize dot-matrix loader recreated from the muload public spec.",
  robots: { index: false, follow: false },
}

const options = [
  {
    name: "Default",
    description: "4px dots · 1× speed · theme foreground",
    snippet: '<Quantize dotSize={4} speed={1} aria-label="Loading" />',
    props: { dotSize: 4, cellPadding: 1.5, speed: 1 },
    dotColor: undefined,
  },
  {
    name: "Brand accent",
    description: "6px dots · 0.7× speed · primary orange",
    snippet:
      '<Quantize dotSize={6} cellPadding={2} speed={0.7}\n  className="text-primary" />',
    props: { dotSize: 6, cellPadding: 2, speed: 0.7 },
    dotColor: "var(--primary)",
  },
  {
    name: "Compact",
    description: "3px dots · 1.8× speed · muted",
    snippet:
      '<Quantize dotSize={3} cellPadding={1} speed={1.8}\n  className="text-muted-foreground" />',
    props: { dotSize: 3, cellPadding: 1, speed: 1.8 },
    dotColor: "var(--muted-foreground)",
  },
]

export default function LoaderPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Temporary preview route
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Quantize loader
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Pure-CSS recreation of the muload &ldquo;quantize&rdquo; dot-matrix
          loader: a 5&times;5 grid fills in random order, holds once complete,
          then resets and repeats. Three tuning options below.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        {options.map((option) => (
          <section
            key={option.name}
            className="flex flex-col overflow-hidden rounded-xl border shadow-xs"
          >
            <div className="flex h-40 items-center justify-center border-b">
              <Quantize
                {...option.props}
                style={
                  option.dotColor
                    ? ({
                        "--color-dot": option.dotColor,
                      } as React.CSSProperties)
                    : undefined
                }
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div>
                <h2 className="text-sm font-semibold">{option.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <pre className="mt-auto overflow-x-auto rounded-md bg-muted/60 p-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {option.snippet}
              </pre>
            </div>
          </section>
        ))}
      </div>

      <footer className="text-xs text-muted-foreground">
        Original implementation built from the public muload spec (prop API,
        5&times;5 grid, reduced-motion fallback). If you later purchase a
        license, replace it via{" "}
        <code className="font-mono">
          npx shadcn@latest add @muload/quantize
        </code>{" "}
        — the import path stays{" "}
        <code className="font-mono">@/components/ui/quantize</code>.
      </footer>
    </main>
  )
}
