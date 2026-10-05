"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFilters } from "@/components/filters-provider";
import { StatusBadge, TrendArrow } from "@/components/indicators";
import { Segmented } from "@/components/segmented";
import { DepartureChart, TourYearChart } from "@/components/charts/tour-charts";
import { DEPARTURES, TOUR_BY_SLUG } from "@/data/seed";
import { departureMargin, summarizeTour, tourInsight, tourMatches, yearsInRange } from "@/lib/analytics";
import { fmtDate, fmtInt, fmtMoney, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TourDetail({ slug }: { slug: string }) {
  const tour = TOUR_BY_SLUG.get(slug)!;
  const { filters } = useFilters();
  const years = yearsInRange(filters);

  const { summary, deps, insight } = useMemo(() => {
    const deps = DEPARTURES.filter((d) => d.tourId === tour.id && years.includes(d.year as (typeof years)[number]));
    const summary = summarizeTour(tour, deps, years);
    return { summary, deps, insight: summary.years.length ? tourInsight(summary, deps) : null };
  }, [tour, years]);

  const [pickedYear, setPickedYear] = useState<string | null>(null);
  const activeYear =
    pickedYear && summary.years.map(String).includes(pickedYear) ? pickedYear : String(summary.years.at(-1) ?? "");
  const yearDeps = deps.filter((d) => String(d.year) === activeYear);
  const outsideFilters = !tourMatches(tour, filters);

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link
          href="/tours"
          className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Tour comparison
        </Link>
        <p className="eyebrow mt-5">
          {tour.region} · {tour.type} · {tour.durationDays} days · avg. ${fmtInt(tour.pricePerPax)} per guest
          {tour.firstYear > 2023 && ` · launched ${tour.firstYear}`}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-[2.25rem] leading-[1.05] text-ink md:text-[3.25rem]">{tour.name}</h1>
          <StatusBadge status={summary.status} className="text-xs" />
        </div>
        {outsideFilters && (
          <p className="mt-2 text-xs text-muted-foreground">
            This tour sits outside the current region or type filter; showing it anyway.
          </p>
        )}
      </div>

      {!summary.years.length ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No departures for this tour in the selected years.
          </CardContent>
        </Card>
      ) : (
        <>
          <section
            className="rise grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule shadow-[0_10px_28px_-18px_rgba(16,33,46,0.25)] lg:grid-cols-4"
            aria-label="Tour metrics"
            style={{ ["--i" as string]: 1 }}
          >
            <Stat label="Average load factor" value={fmtPct(summary.total.lf, 1)} sub={<>break-even {fmtPct(summary.total.beLf)} · <TrendArrow trend={summary.trend} slope={summary.slope} /></>} />
            <Stat
              label="Departures run / cancelled"
              value={`${summary.total.operated} / ${summary.total.cancelled}`}
              sub={summary.total.upcoming ? `+${summary.total.upcoming} upcoming` : `${summary.total.departures} scheduled`}
              tone={summary.total.cancelled ? "bad" : undefined}
            />
            <Stat
              label="Cumulative margin"
              value={fmtMoney(summary.total.margin, { signed: true })}
              sub={`on ${fmtMoney(summary.total.revenue)} revenue`}
              tone={summary.total.margin < 0 ? "bad" : undefined}
            />
            <Stat
              label="Cancellation & rebooking cost"
              value={fmtMoney(summary.total.cancellationCost)}
              sub={summary.total.lowWaterCancelled ? `${summary.total.lowWaterCancelled} low water cancellations` : "attrition fees + rebooking"}
              tone={summary.total.cancellationCost ? "bad" : undefined}
            />
          </section>

          <section className="rise grid grid-cols-1 gap-5 lg:grid-cols-5" style={{ ["--i" as string]: 2 }}>
            {insight && (
              <article className="relative overflow-hidden rounded-lg bg-ink p-6 text-[#f6f1e4] shadow-[0_18px_40px_-24px_rgba(16,33,46,0.6)] lg:col-span-2">
                <svg className="pointer-events-none absolute -top-10 -right-10 size-48 text-[#e3b261]/15" viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" />
                  <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" />
                  <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" />
                </svg>
                <div className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.12em] text-[#e3b261] uppercase">
                  <Sparkles className="size-4" aria-hidden />
                  AI insight
                  <span className="rounded-full border border-[#e3b261]/50 px-1.5 py-px text-[0.625rem] tracking-[0.08em]">Demo</span>
                </div>
                <p className="font-display mt-4 text-[1.625rem] leading-[1.15]">{insight.headline}</p>
                {insight.points.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#f6f1e4]/80">
                    {insight.points.map((p) => (
                      <li key={p} className="flex gap-2.5">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#e3b261]" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 border-t border-white/15 pt-4">
                  <div className="font-mono text-[0.6875rem] tracking-[0.12em] text-[#e3b261] uppercase">Recommendation</div>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed font-medium">{insight.recommendation}</p>
                </div>
                <p className="mt-4 text-[0.6875rem] text-[#f6f1e4]/50">Generated from the sample data with fixed rules.</p>
              </article>
            )}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Load factor by year</CardTitle>
                <CardDescription>{summary.statusReason}</CardDescription>
              </CardHeader>
              <CardContent>
                <TourYearChart
                  rows={summary.years.map((y) => ({
                    year: String(y),
                    lf: summary.byYear[y]!.lf,
                    beLf: summary.byYear[y]!.beLf,
                    departures: summary.byYear[y]!.departures,
                  }))}
                />
              </CardContent>
            </Card>
          </section>

          <Card className="rise" style={{ ["--i" as string]: 3 }}>
            <CardHeader>
              <CardTitle>Departures in {activeYear}</CardTitle>
              <CardDescription>Booked pax against break-even and capacity for each departure</CardDescription>
              {summary.years.length > 1 && (
                <CardAction>
                  <Segmented
                    label="Year"
                    value={activeYear}
                    onChange={setPickedYear}
                    options={summary.years.map((y) => ({ value: String(y), label: String(y) }))}
                  />
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <DepartureChart departures={yearDeps} />
              <div className="-mx-(--card-spacing)">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-(--card-spacing)">Departure</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Booked / BE / cap.</TableHead>
                      <TableHead className="text-right">Load factor</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rebooking cost</TableHead>
                      <TableHead className="pr-(--card-spacing) text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearDeps.map((d) => {
                      const m = departureMargin(d);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="pl-(--card-spacing) tabular">
                            {fmtDate(d.date)}
                            <div className="text-[11px] text-muted-foreground">{d.season}</div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase",
                                d.status === "operated" && "border-rule bg-muted text-ink",
                                d.status === "cancelled" && "border-[#d99a8c] bg-[var(--cell-below)] text-[#8a2414]",
                                d.status === "upcoming" && "border-[#9cc3dc] bg-[#dcebf4] text-[#0b4a6e]",
                              )}
                            >
                              {d.status}
                            </span>
                            {d.cancellationReason && (
                              <div className="mt-1 text-[11px] text-muted-foreground">{d.cancellationReason}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular">
                            <span className={d.bookedPax < d.breakEvenPax ? "font-medium text-[var(--text-critical)]" : "font-medium"}>
                              {d.bookedPax}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              / {d.breakEvenPax} / {d.capacity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular">{fmtPct(d.bookedPax / d.capacity)}</TableCell>
                          <TableCell className="text-right tabular">{d.revenue ? fmtMoney(d.revenue) : "n/a"}</TableCell>
                          <TableCell className="text-right tabular">
                            {d.rebookingCost ? fmtMoney(d.rebookingCost) : <span className="text-muted-foreground">n/a</span>}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "pr-(--card-spacing) text-right font-medium tabular",
                              m < 0 && "text-[var(--text-critical)]",
                            )}
                          >
                            {fmtMoney(m, { signed: true })}
                            {d.status === "upcoming" && <div className="text-[11px] font-normal text-muted-foreground">projected</div>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: React.ReactNode; tone?: "bad" }) {
  return (
    <div className="flex flex-col gap-2 bg-card p-5">
      <div className="eyebrow">{label}</div>
      <div className={cn("font-display text-[2.5rem] leading-none tabular", tone === "bad" ? "text-[var(--text-critical)]" : "text-ink")}>
        {value}
      </div>
      {sub && <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
