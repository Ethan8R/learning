"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Subtitle1,
  Text,
  Title2,
} from "@fluentui/react-components";
import {
  CalendarCancelRegular,
  CheckmarkCircleRegular,
  ChevronRightRegular,
  DataTrendingRegular,
  MoneyRegular,
  ShieldCheckmarkRegular,
  WarningRegular,
} from "@fluentui/react-icons";
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
  Rework: "var(--colorPaletteDarkOrangeBackground3)",
  "Retire candidate": "var(--status-critical)",
};

const negative = "text-[var(--colorStatusDangerForeground1)]";

export default function OverviewPage() {
  const router = useRouter();
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
  const retire = statusCounts.find((x) => x.s === "Retire candidate")!;

  const dir = (a: number, b: number) => (a > b ? "up" : a < b ? "down" : "flat") as "up" | "down" | "flat";
  const caption = prevAgg ? `${latest} vs ${prev}` : `${latest}`;
  const lfDelta = prevAgg ? latestAgg.lf - prevAgg.lf : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Title2 as="h1">Portfolio overview</Title2>
        <Body1 className="text-[var(--colorNeutralForeground2)]">
          In {latest} the portfolio filled <strong>{fmtPct(latestAgg.lf)}</strong> of seats
          {prevAgg && Math.abs(lfDelta) >= 0.001
            ? `, ${(Math.abs(lfDelta) * 100).toFixed(1)} pts ${lfDelta < 0 ? "down" : "up"} on ${prev}`
            : ""}
          . {summaries.length} tours · {fmtInt(scope.departures)} departures · {years[0]}
          {years.length > 1 ? `–${latest}` : ""}.
        </Body1>
      </header>

      {retire.n > 0 && (
        <MessageBar intent="error" layout="multiline">
          <MessageBarBody>
            <MessageBarTitle>
              {retire.n} tour{retire.n > 1 ? "s have" : " has"} missed break-even three years or more
            </MessageBarTitle>
            {retire.margin < 0
              ? `Cumulative loss of ${fmtMoney(-retire.margin)} across the selected years. These are the strongest candidates to drop from the 2028 programme.`
              : "Review them before the next contracting round."}
          </MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => router.push(`/tours?status=${encodeURIComponent("Retire candidate")}`)}>
              Review retire candidates
            </Button>
          </MessageBarActions>
        </MessageBar>
      )}

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<DataTrendingRegular />}
          label={`Average load factor, ${latest}`}
          value={fmtPct(latestAgg.lf, 1)}
          delta={prevAgg ? fmtPts(latestAgg.lf - prevAgg.lf) : undefined}
          deltaDirection={prevAgg ? dir(latestAgg.lf, prevAgg.lf) : undefined}
          goodWhen="up"
          caption={`${caption} · break-even ${fmtPct(latestAgg.beLf)}`}
          spark={byYear.map((y) => y.lf)}
        />
        <KpiCard
          icon={<CheckmarkCircleRegular />}
          label={`Departures above break-even, ${latest}`}
          value={fmtPct(latestAgg.pctAbove)}
          delta={prevAgg ? fmtPts(latestAgg.pctAbove - prevAgg.pctAbove, 0) : undefined}
          deltaDirection={prevAgg ? dir(latestAgg.pctAbove, prevAgg.pctAbove) : undefined}
          goodWhen="up"
          caption={`${caption} · ${latestAgg.aboveCount} of ${latestAgg.departures}`}
          spark={byYear.map((y) => y.pctAbove)}
        />
        <KpiCard
          icon={<CalendarCancelRegular />}
          label={`Departures cancelled, ${latest}`}
          value={fmtInt(latestAgg.cancelled)}
          delta={prevAgg ? fmtChange(latestAgg.cancelled, prevAgg.cancelled) : undefined}
          deltaDirection={prevAgg ? dir(latestAgg.cancelled, prevAgg.cancelled) : undefined}
          goodWhen="down"
          caption={`${caption}${latestAgg.lowWaterCancelled ? ` · ${latestAgg.lowWaterCancelled} low water` : ""}`}
          spark={byYear.map((y) => y.cancelled)}
        />
        <KpiCard
          icon={<MoneyRegular />}
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
          <CardHeader
            header={<Subtitle1 as="h2">Average load factor</Subtitle1>}
            description={
              <Caption1 className="text-[var(--colorNeutralForeground3)]">
                Booked pax ÷ capacity, including cancelled departures at the bookings they held.
              </Caption1>
            }
          />
          <div className="flex flex-wrap gap-2">
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
                { value: "type", label: "By tour type" },
              ]}
            />
          </div>
          {series.length ? (
            <LfTrendChart data={series} split={split} breakEven={scope.beLf} />
          ) : (
            <Body1 className="py-16 text-center text-[var(--colorNeutralForeground3)]">No departures match these filters.</Body1>
          )}
        </Card>

        <Card>
          <CardHeader
            header={<Subtitle1 as="h2">Portfolio health</Subtitle1>}
            description={
              <Caption1 className="text-[var(--colorNeutralForeground3)]">
                Auto-assigned status across {summaries.length} tours, with cumulative margin
              </Caption1>
            }
          />
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-[var(--borderRadiusCircular)]" aria-hidden>
            {statusCounts.map(({ s, n }) => (n ? <div key={s} style={{ flexGrow: n, background: STATUS_FILL[s] }} /> : null))}
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {statusCounts.map(({ s, n, margin }, i) => (
              <li key={s}>
                {i > 0 && <Divider />}
                <Link
                  href={`/tours?status=${encodeURIComponent(s)}`}
                  className="-mx-2 flex min-h-11 items-center gap-3 rounded-[var(--borderRadiusMedium)] px-2 text-inherit no-underline hover:bg-[var(--colorSubtleBackgroundHover)]"
                >
                  <Text size={600} weight="semibold" className="w-9 tabular">
                    {n}
                  </Text>
                  <StatusBadge status={s} />
                  <Caption1 className={`ml-auto tabular ${margin < 0 ? negative : "text-[var(--colorNeutralForeground3)]"}`}>
                    {fmtMoney(margin, { signed: true })}
                  </Caption1>
                  <ChevronRightRegular className="text-[var(--colorNeutralForeground3)]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <MessageBar intent="info" layout="multiline" className="mt-auto">
            <MessageBarBody>
              <MessageBarTitle>How status is set</MessageBarTitle>
              Retire candidate: below break-even 3+ years. Rework: below 2 years. Watch: below or within 5 pts in the
              latest year, or declining with thin headroom. Keep: everything else.
            </MessageBarBody>
          </MessageBar>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            image={<WarningRegular fontSize={24} className="text-[var(--colorStatusDangerForeground1)]" aria-hidden />}
            header={<Subtitle1 as="h2">Needs attention</Subtitle1>}
            description={
              <Caption1 className="text-[var(--colorNeutralForeground3)]">
                Below break-even 2+ consecutive years, sorted by cumulative loss
              </Caption1>
            }
          />
          <TourList items={attention} years={years} empty="No tours below break-even for 2+ consecutive years." />
        </Card>
        <Card>
          <CardHeader
            image={<ShieldCheckmarkRegular fontSize={24} className="text-[var(--colorStatusSuccessForeground1)]" aria-hidden />}
            header={<Subtitle1 as="h2">Reliable performers</Subtitle1>}
            description={
              <Caption1 className="text-[var(--colorNeutralForeground3)]">
                Above break-even every year in range, highest load factor first
              </Caption1>
            }
          />
          <TourList items={reliable} years={years} empty="No tours above break-even in every year of this range." />
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
  if (!items.length)
    return <Body1 className="py-6 text-center text-[var(--colorNeutralForeground3)]">{empty}</Body1>;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {items.slice(0, 8).map((s, i) => (
        <li key={s.tour.id}>
          {i > 0 && <Divider />}
          <Link
            href={`/tours/${s.tour.slug}`}
            className="-mx-2 flex min-h-14 items-center gap-3 rounded-[var(--borderRadiusMedium)] px-2 py-2 text-inherit no-underline hover:bg-[var(--colorSubtleBackgroundHover)]"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <Text weight="semibold" truncate wrap={false}>
                {s.tour.name}
              </Text>
              <Caption1 truncate wrap={false} className="text-[var(--colorNeutralForeground3)]">
                {s.tour.region} · {s.tour.type}
              </Caption1>
            </div>
            <div className="hidden gap-1 sm:flex" aria-label="Load factor by year">
              {years.map((y) => (
                <div key={y} className="w-12">
                  <LfCell lf={s.byYear[y]?.lf} beLf={s.byYear[y]?.beLf} compact />
                </div>
              ))}
            </div>
            <div className="flex w-20 flex-col items-end">
              <Text weight="semibold" className={`tabular ${s.total.margin < 0 ? negative : ""}`}>
                {fmtMoney(s.total.margin, { signed: true })}
              </Text>
              <Caption1 className="text-[var(--colorNeutralForeground3)]">cum. margin</Caption1>
            </div>
            <ChevronRightRegular className="text-[var(--colorNeutralForeground3)]" aria-hidden />
          </Link>
        </li>
      ))}
      {items.length > 8 && (
        <li className="pt-2">
          <Caption1 className="text-[var(--colorNeutralForeground3)]">
            +{items.length - 8} more in <Link href="/tours">Tour comparison</Link>
          </Caption1>
        </li>
      )}
    </ul>
  );
}
