"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, GRID, LegendItem, TooltipCard, pctTick } from "./chart-kit";
import type { Departure } from "@/data/types";
import { bandOf, type Band } from "@/lib/analytics";
import { fmtDate, fmtDateShort, fmtMoney, fmtPct } from "@/lib/format";
import { departureMargin } from "@/lib/analytics";

const BAND_FILL: Record<Band, string> = {
  below: "var(--status-critical)",
  near: "var(--status-warning)",
  above: "var(--status-good)",
};

export function TourYearChart({ rows }: { rows: { year: string; lf: number; beLf: number; departures: number }[] }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        <LegendItem color={BAND_FILL.above} label="Above break-even" />
        <LegendItem color={BAND_FILL.near} label="Within 5 pts" />
        <LegendItem color={BAND_FILL.below} label="Below break-even" />
        <LegendItem color="var(--foreground)" label="Break-even LF" kind="dash" />
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap="30%">
            <CartesianGrid {...GRID} />
            <XAxis dataKey="year" {...AXIS} />
            <YAxis {...AXIS} axisLine={false} domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={pctTick} width={48} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipCard
                    title={label}
                    rows={[
                      { label: "Load factor", value: fmtPct(payload[0].payload.lf, 1), swatch: BAND_FILL[bandOf(payload[0].payload.lf, payload[0].payload.beLf)] },
                      { label: "Break-even LF", value: fmtPct(payload[0].payload.beLf, 1), swatch: "var(--foreground)", dashed: true },
                      { label: "Departures", value: payload[0].payload.departures },
                    ]}
                  />
                ) : null
              }
            />
            <Bar dataKey="lf" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.year} fill={BAND_FILL[bandOf(r.lf, r.beLf)]} />
              ))}
            </Bar>
            <Line dataKey="beLf" stroke="var(--foreground)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} type="step" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const DEP_FILL = {
  above: "var(--series-1)",
  below: "var(--status-critical)",
  cancelled: "#b9b8b1",
  upcoming: "color-mix(in oklab, var(--series-1) 45%, white)",
};

const depKind = (d: Departure) =>
  d.status === "cancelled" ? "cancelled" : d.status === "upcoming" ? "upcoming" : d.bookedPax >= d.breakEvenPax ? "above" : "below";

export function DepartureChart({ departures }: { departures: Departure[] }) {
  const rows = departures.map((d) => ({ ...d, label: fmtDateShort(d.date) }));
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        <LegendItem color={DEP_FILL.above} label="Booked, at or above break-even" />
        <LegendItem color={DEP_FILL.below} label="Booked, below break-even" />
        <LegendItem color={DEP_FILL.cancelled} label="Cancelled" />
        <LegendItem color={DEP_FILL.upcoming} label="Upcoming" />
        <LegendItem color="var(--foreground)" label="Break-even pax" kind="dash" />
        <LegendItem color="var(--chart-axis)" label="Capacity" kind="line" />
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap="20%">
            <CartesianGrid {...GRID} />
            <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={8} />
            <YAxis {...AXIS} axisLine={false} width={48} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Departure;
                return (
                  <TooltipCard
                    title={`${fmtDate(d.date)} · ${d.status}${d.cancellationReason ? ` (${d.cancellationReason.toLowerCase()})` : ""}`}
                    rows={[
                      { label: "Booked pax", value: d.bookedPax, swatch: DEP_FILL[depKind(d)] },
                      { label: "Break-even pax", value: d.breakEvenPax, swatch: "var(--foreground)", dashed: true },
                      { label: "Capacity", value: d.capacity, swatch: "var(--chart-axis)", dashed: false },
                      { label: "Load factor", value: fmtPct(d.bookedPax / d.capacity) },
                      { label: d.status === "upcoming" ? "Projected margin" : "Margin", value: fmtMoney(departureMargin(d), { signed: true }) },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="bookedPax" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
              {rows.map((d) => (
                <Cell key={d.id} fill={DEP_FILL[depKind(d)]} />
              ))}
            </Bar>
            <Line dataKey="breakEvenPax" stroke="var(--foreground)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} type="step" isAnimationActive={false} />
            <Line dataKey="capacity" stroke="var(--chart-axis)" strokeWidth={1.5} dot={false} type="step" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
