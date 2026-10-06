"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, GRID, LegendItem, TooltipCard, pctTick } from "./chart-kit";
import { fmtPct } from "@/lib/format";

type Row = Record<string, number | string | null>;

export function LfTrendChart({ data, split, breakEven }: { data: Row[]; split: "none" | "type"; breakEven: number }) {
  const series =
    split === "type"
      ? [
          { key: "river", label: "River cruise", color: "var(--series-1)" },
          { key: "land", label: "Escorted land tour", color: "var(--series-2)" },
        ]
      : [{ key: "lf", label: "Average load factor", color: "var(--series-1)" }];

  // Fit the y-axis to the data so year-to-year movement is visible.
  const values = data.flatMap((r) => series.map((s) => r[s.key])).filter((v): v is number => typeof v === "number");
  const lo = Math.max(0, Math.floor((Math.min(breakEven, ...values) - 0.03) * 10) / 10);
  const hi = Math.min(1, Math.ceil((Math.max(breakEven, ...values) + 0.03) * 10) / 10);
  const step = hi - lo > 0.35 ? 0.1 : 0.05;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => Math.round((lo + i * step) * 100) / 100);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        {series.length > 1 && series.map((s) => <LegendItem key={s.key} color={s.color} label={s.label} kind="line" />)}
        <LegendItem color="var(--status-critical)" label={`Break-even (${fmtPct(breakEven)})`} kind="dash" />
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="period" {...AXIS} interval="preserveStartEnd" minTickGap={16} />
            <YAxis {...AXIS} axisLine={false} domain={[lo, hi]} ticks={ticks} tickFormatter={pctTick} width={48} />
            <ReferenceLine y={breakEven} stroke="var(--status-critical)" strokeDasharray="5 4" strokeWidth={1.5} ifOverflow="extendDomain" />
            <Tooltip
              cursor={{ stroke: "var(--chart-baseline)", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipCard
                    title={label}
                    rows={[
                      ...series
                        .map((s) => ({ s, v: payload[0].payload[s.key] as number | null }))
                        .filter(({ v }) => v != null)
                        .map(({ s, v }) => ({ label: s.label, value: fmtPct(v!, 1), swatch: s.color })),
                      { label: "Break-even LF", value: fmtPct(payload[0].payload.beLf as number, 1), swatch: "var(--status-critical)", dashed: true },
                      { label: "Departures", value: String(payload[0].payload.departures) },
                    ]}
                  />
                ) : null
              }
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 4, fill: s.color, stroke: "var(--colorNeutralBackground1)", strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: "var(--colorNeutralBackground1)", strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
