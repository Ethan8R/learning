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
    <div className="space-y-6">
      <div>
        <Link href="/tours" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          Tour comparison
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{tour.name}</h1>
          <StatusBadge status={summary.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {tour.region} · {tour.type} · {tour.durationDays} days · avg. ${fmtInt(tour.pricePerPax)} per guest
          {tour.firstYear > 2023 && ` · launched ${tour.firstYear}`}
        </p>
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
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Tour metrics">
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

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {insight && (
              <Card className="border-violet-200 bg-gradient-to-b from-violet-50/70 to-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-4 text-violet-600" aria-hidden />
                    AI insight
                  </CardTitle>
                  <CardDescription>Demo: generated from the sample data with fixed rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed">
                  <p className="font-medium">{insight.headline}</p>
                  {insight.points.length > 0 && (
                    <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                      {insight.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                  <div className="rounded-lg border border-violet-200 bg-card p-3">
                    <div className="text-xs font-semibold tracking-wide text-violet-700 uppercase">Recommendation</div>
                    <p className="mt-1">{insight.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
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

          <Card>
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
                                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                                d.status === "operated" && "bg-muted text-foreground",
                                d.status === "cancelled" && "bg-red-50 text-red-900",
                                d.status === "upcoming" && "bg-sky-50 text-sky-900",
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
    <Card className="gap-1 px-4 py-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-semibold tracking-tight tabular", tone === "bad" && "text-[var(--text-critical)]")}>
        {value}
      </div>
      {sub && <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}
