"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilters } from "@/components/filters-provider";
import { KpiCard } from "@/components/kpi-card";
import { LfTrendChart } from "@/components/charts/lf-trend-chart";
import { Segmented } from "@/components/segmented";
import { LfCell, StatusBadge } from "@/components/indicators";
import { DEPARTURES, YEARS, type Year } from "@/data/seed";
import {
  aggregate,
  filterDepartures,
  lfSeries,
  needsAttention,
  reliablePerformers,
  summarizeTours,
  tourMatches,
  yearsInRange,
  type TourStatus,
} from "@/lib/analytics";
import { fmtChange, fmtInt, fmtMoney, fmtPct, fmtPts } from "@/lib/format";

const STATUS_ORDER: TourStatus[] = ["Keep", "Watch", "Rework", "Retire candidate"];
const STATUS_FILL: Record<TourStatus, string> = {
  Keep: "var(--status-good)",
  Watch: "var(--status-warning)",
  Rework: "#d27a3a",
  "Retire candidate": "var(--status-critical)",
};

export default function OverviewPage() {
  const { filters } = useFilters();
  const [granularity, setGranularity] = useState<"year" | "quarter">("year");
  const [split, setSplit] = useState<"none" | "type">("none");

  const years = yearsInRange(filters);
  const latest = years.at(-1)!;
  const prev = (latest - 1) as Year;

  const { byYear, prevAgg, summaries, scope } = useMemo(() => {
    const scoped = DEPARTURES.filter((d) => tourMatches(d, filters));
    const agg = (y: number) => aggregate(scoped.filter((d) => d.year === y));
    return {
      byYear: years.map((y) => ({ year: y, ...agg(y) })),
      prevAgg: YEARS.includes(prev) ? agg(prev) : undefined,
      summaries: summarizeTours(filters),
      scope: aggregate(filterDepartures(filters)),
    };
  }, [filters, years, prev]);

  const latestAgg = byYear.at(-1)!;
  const series = useMemo(() => lfSeries(filters, granularity, split), [filters, granularity, split]);
  const attention = needsAttention(summaries);
  const reliable = reliablePerformers(summaries);
  const statusCounts = STATUS_ORDER.map((s) => {
    const group = summaries.filter((x) => x.status === s);
    return { s, n: group.length, margin: group.reduce((sum, x) => sum + x.total.margin, 0) };
  });

  const dir = (a: number, b: number) => (a > b ? "up" : a < b ? "down" : "flat") as "up" | "down" | "flat";
  const caption = prevAgg ? `${latest} vs ${prev}` : `${latest}`;

  const retire = statusCounts.find((x) => x.s === "Retire candidate")!;
  const lfDelta = prevAgg ? latestAgg.lf - prevAgg.lf : 0;

  return (
    <div className="space-y-8">
      <header className="rise grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="eyebrow">
            Portfolio overview · {summaries.length} tours · {fmtInt(scope.departures)} departures · {years[0]}
            {years.length > 1 ? `–${latest}` : ""}
          </p>
          <h1 className="mt-3 max-w-[26ch] text-[2.25rem] leading-[1.05] text-ink md:text-[3.25rem]">
            In {latest}, the portfolio filled <span className="text-river">{fmtPct(latestAgg.lf)}</span> of seats
            {prevAgg && Math.abs(lfDelta) >= 0.001 ? (
              <>
                , <em className={lfDelta < 0 ? "text-[var(--text-critical)]" : "text-[var(--text-good)]"}>
                  {(Math.abs(lfDelta) * 100).toFixed(1)} pts {lfDelta < 0 ? "down" : "up"}
                </em>{" "}
                on {prev}.
              </>
            ) : (
              "."
            )}
          </h1>
        </div>
        {retire.n > 0 && (
          <Link
            href={`/tours?status=${encodeURIComponent("Retire candidate")}`}
            className="group flex max-w-sm items-start gap-3 rounded-lg border border-[#d99a8c] bg-[var(--cell-below)]/60 p-4 transition-colors duration-200 hover:bg-[var(--cell-below)]"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-[var(--text-critical)]" aria-hidden />
            <span className="text-sm leading-snug text-ink">
              <strong className="font-semibold">
                {retire.n} tour{retire.n > 1 ? "s" : ""}
              </strong>{" "}
              {retire.n > 1 ? "have" : "has"} missed break-even three years or more
              {retire.margin < 0 ? (
                <>
                  , losing <strong className="font-semibold">{fmtMoney(-retire.margin)}</strong>.
                </>
              ) : (
                "."
              )}
              <span className="mt-1 flex items-center gap-1 font-medium text-[var(--text-critical)] group-hover:underline">
                Review retire candidates <ChevronRight className="size-4" aria-hidden />
              </span>
            </span>
          </Link>
        )}
      </header>

      <section
        aria-label="Key metrics"
        className="rise grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule shadow-[0_10px_28px_-18px_rgba(16,33,46,0.25)] sm:grid-cols-2 xl:grid-cols-4"
        style={{ ["--i" as string]: 1 }}
      >
        <KpiCard
          label={`Average load factor, ${latest}`}
          value={fmtPct(latestAgg.lf, 1)}
          delta={prevAgg ? fmtPts(latestAgg.lf - prevAgg.lf) : undefined}
          deltaDirection={prevAgg ? dir(latestAgg.lf, prevAgg.lf) : undefined}
          goodWhen="up"
          caption={`${caption} · break-even ${fmtPct(latestAgg.beLf)}`}
          spark={byYear.map((y) => y.lf)}
        />
        <KpiCard
          label={`Departures above break-even, ${latest}`}
          value={fmtPct(latestAgg.pctAbove)}
          delta={prevAgg ? fmtPts(latestAgg.pctAbove - prevAgg.pctAbove, 0) : undefined}
          deltaDirection={prevAgg ? dir(latestAgg.pctAbove, prevAgg.pctAbove) : undefined}
          goodWhen="up"
          caption={`${caption} · ${latestAgg.aboveCount} of ${latestAgg.departures}`}
          spark={byYear.map((y) => y.pctAbove)}
        />
        <KpiCard
          label={`Departures cancelled, ${latest}`}
          value={fmtInt(latestAgg.cancelled)}
          delta={prevAgg ? fmtChange(latestAgg.cancelled, prevAgg.cancelled) : undefined}
          deltaDirection={prevAgg ? dir(latestAgg.cancelled, prevAgg.cancelled) : undefined}
          goodWhen="down"
          caption={`${caption}${latestAgg.lowWaterCancelled ? ` · ${latestAgg.lowWaterCancelled} low water` : ""}`}
          spark={byYear.map((y) => y.cancelled)}
        />
        <KpiCard
          label={`Cancellation & rebooking cost, ${latest}`}
          value={fmtMoney(latestAgg.cancellationCost)}
          delta={prevAgg ? fmtChange(latestAgg.cancellationCost, prevAgg.cancellationCost) : undefined}
          deltaDirection={prevAgg ? dir(latestAgg.cancellationCost, prevAgg.cancellationCost) : undefined}
          goodWhen="down"
          caption={`${caption} · ${fmtMoney(scope.cancellationCost)} across range`}
          spark={byYear.map((y) => y.cancellationCost)}
        />
      </section>

      <section className="rise grid grid-cols-1 gap-5 lg:grid-cols-3" style={{ ["--i" as string]: 2 }}>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average load factor</CardTitle>
            <CardDescription>
              Booked pax ÷ capacity, all departures including cancelled ones at bookings held when cancelled.
            </CardDescription>
            <CardAction className="flex flex-wrap justify-end gap-2">
              <Segmented
                label="Granularity"
                value={granularity}
                onChange={setGranularity}
                options={[
                  { value: "year", label: "By year" },
                  { value: "quarter", label: "By quarter" },
                ]}
              />
              <Segmented
                label="Split"
                value={split}
                onChange={setSplit}
                options={[
                  { value: "none", label: "Total" },
                  { value: "type", label: "By type" },
                ]}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            {series.length ? (
              <LfTrendChart data={series} split={split} breakEven={scope.beLf} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No departures match these filters.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio health</CardTitle>
            <CardDescription>Auto-assigned status across {summaries.length} tours, with cumulative margin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
              {statusCounts.map(({ s, n }) =>
                n ? <div key={s} style={{ flexGrow: n, background: STATUS_FILL[s] }} title={`${s}: ${n}`} /> : null,
              )}
            </div>
            <ul className="divide-y divide-rule">
              {statusCounts.map(({ s, n, margin }) => (
                <li key={s}>
                  <Link
                    href={`/tours?status=${encodeURIComponent(s)}`}
                    className="group -mx-2 flex min-h-12 items-center gap-3 rounded-md px-2 transition-colors duration-200 hover:bg-muted/70"
                  >
                    <span className="font-display w-8 text-[1.75rem] leading-none text-ink tabular">{n}</span>
                    <StatusBadge status={s} />
                    <span
                      className={`ml-auto font-mono text-xs tabular ${margin < 0 ? "text-[var(--text-critical)]" : "text-muted-foreground"}`}
                      title="Cumulative margin across the selected years"
                    >
                      {fmtMoney(margin, { signed: true })}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-dashed border-rule pt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="eyebrow mr-1">How status is set</span>
              Retire candidate = below break-even 3+ years. Rework = below 2 years. Watch = below or within 5 pts in
              the latest year, or declining with thin headroom. Keep = everything else.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rise grid grid-cols-1 gap-5 lg:grid-cols-2" style={{ ["--i" as string]: 3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-[var(--status-critical)]" aria-hidden />
              Needs attention
            </CardTitle>
            <CardDescription>Below break-even 2+ consecutive years, sorted by cumulative loss</CardDescription>
          </CardHeader>
          <CardContent>
            <TourList items={attention} years={years} empty="No tours below break-even for 2+ consecutive years." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[var(--status-good)]" aria-hidden />
              Reliable performers
            </CardTitle>
            <CardDescription>Above break-even every year in range, highest load factor first</CardDescription>
          </CardHeader>
          <CardContent>
            <TourList items={reliable} years={years} empty="No tours above break-even in every year of this range." />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function TourList({
  items,
  years,
  empty,
}: {
  items: ReturnType<typeof summarizeTours>;
  years: Year[];
  empty: string;
}) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="-mx-2 divide-y divide-rule">
      {items.slice(0, 8).map((s, i) => (
        <li key={s.tour.id}>
          <Link
            href={`/tours/${s.tour.slug}`}
            className="group flex min-h-14 items-center gap-3 rounded-md px-2 py-2.5 transition-colors duration-200 hover:bg-muted/70"
          >
            <span className="font-display w-6 text-xl leading-none text-muted-foreground/70 tabular">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{s.tour.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {s.tour.region} · {s.tour.type}
              </div>
            </div>
            <div className="hidden gap-1 sm:flex" aria-label="Load factor by year">
              {years.map((y) => (
                <div key={y} className="w-12">
                  <LfCell lf={s.byYear[y]?.lf} beLf={s.byYear[y]?.beLf} compact />
                </div>
              ))}
            </div>
            <div className="w-20 text-right">
              <div
                className={`font-mono text-sm font-medium tabular ${s.total.margin < 0 ? "text-[var(--text-critical)]" : "text-ink"}`}
              >
                {fmtMoney(s.total.margin, { signed: true })}
              </div>
              <div className="eyebrow text-[0.625rem]">cum. margin</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
          </Link>
        </li>
      ))}
      {items.length > 8 && (
        <li className="px-2 pt-2.5 text-xs text-muted-foreground">
          +{items.length - 8} more in{" "}
          <Link href="/tours" className="underline underline-offset-2">
            Tour comparison
          </Link>
        </li>
      )}
    </ul>
  );
}
