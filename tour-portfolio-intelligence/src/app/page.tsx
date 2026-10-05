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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Portfolio overview</h1>
          <p className="text-sm text-muted-foreground">
            {summaries.length} tours · {fmtInt(scope.departures)} departures · {years[0]}
            {years.length > 1 ? `–${latest}` : ""}
          </p>
        </div>
      </div>

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
          <CardContent className="space-y-3">
            {statusCounts.map(({ s, n, margin }) => (
              <Link
                key={s}
                href={`/tours?status=${encodeURIComponent(s)}`}
                className="group flex items-center gap-3 rounded-md p-1 -m-1 hover:bg-muted/60"
              >
                <StatusBadge status={s} className="w-36 justify-start" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/70"
                    style={{ width: `${summaries.length ? (n / summaries.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right text-sm font-semibold tabular">{n}</span>
                <span
                  className={`w-16 text-right text-xs tabular ${margin < 0 ? "text-[var(--text-critical)]" : "text-muted-foreground"}`}
                  title="Cumulative margin across the selected years"
                >
                  {fmtMoney(margin, { signed: true })}
                </span>
              </Link>
            ))}
            <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">How status is set: </span>
              Retire candidate = below break-even 3+ years. Rework = below 2 years. Watch = below or within 5 pts in
              the latest year, or declining with thin headroom. Keep = everything else.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-[var(--status-critical)]" aria-hidden />
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
              <ShieldCheck className="size-4 text-[var(--status-good)]" aria-hidden />
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
    <ul className="-mx-2 divide-y">
      {items.slice(0, 8).map((s) => (
        <li key={s.tour.id}>
          <Link href={`/tours/${s.tour.slug}`} className="group flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/60">
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
                className={`text-sm font-semibold tabular ${s.total.margin < 0 ? "text-[var(--text-critical)]" : ""}`}
              >
                {fmtMoney(s.total.margin, { signed: true })}
              </div>
              <div className="text-[11px] text-muted-foreground">cum. margin</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" aria-hidden />
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
