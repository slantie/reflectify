"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const distributionConfig = {
  responses: { label: "Responses", color: "var(--chart-1)" },
} satisfies ChartConfig

const rankingConfig = {
  rating: { label: "Average rating", color: "var(--chart-1)" },
} satisfies ChartConfig

const completionConfig = {
  completed: { label: "Completed", color: "var(--chart-1)" },
  pending: { label: "Not submitted", color: "var(--chart-5)" },
} satisfies ChartConfig

type Ranking = {
  label: string
  detail: string
  average: number
  responses: number
}

export function ResponseDistributionChart({
  data,
}: {
  data: { score: string; responses: number }[]
}) {
  return (
    <ChartContainer config={distributionConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="score"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent labelFormatter={(value) => `Score ${value}`} />
          }
        />
        <Bar
          dataKey="responses"
          fill="var(--color-responses)"
          radius={[5, 5, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function CompletionChart({
  submitted,
  invited,
}: {
  submitted: number
  invited: number
}) {
  const completed = invited > 0 ? Math.round((submitted / invited) * 100) : 0
  const data = [
    { name: "completed", value: completed, fill: "var(--color-completed)" },
    {
      name: "pending",
      value: Math.max(0, 100 - completed),
      fill: "var(--color-pending)",
    },
  ]

  return (
    <ChartContainer
      config={completionConfig}
      className="mx-auto h-64 w-full max-w-sm"
    >
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="name" hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={74}
          outerRadius={98}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                return null
              return (
                <text
                  x={viewBox.cx}
                  y={viewBox.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  <tspan
                    x={viewBox.cx}
                    y={viewBox.cy}
                    className="fill-foreground text-3xl font-semibold"
                  >
                    {completed}%
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    y={(viewBox.cy || 0) + 22}
                    className="fill-muted-foreground text-xs"
                  >
                    completed
                  </tspan>
                </text>
              )
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

export function RankingChart({ data }: { data: Ranking[] }) {
  return (
    <ChartContainer
      config={rankingConfig}
      className="h-[min(24rem,calc(11rem+var(--ranking-count)*2.75rem))] w-full"
      style={{ "--ranking-count": data.length } as React.CSSProperties}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 14, left: 0, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 10]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={96}
          tickMargin={8}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {item.payload.detail}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {Number(value).toFixed(1)} / 10
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="average"
          fill="var(--color-rating)"
          radius={[0, 5, 5, 0]}
          barSize={22}
        />
      </BarChart>
    </ChartContainer>
  )
}
