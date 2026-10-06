"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  Body1,
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  Caption1,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  Subtitle1,
  Subtitle2,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
} from "@fluentui/react-components";
import { LightbulbRegular, SparkleFilled } from "@fluentui/react-icons";
import { useFilters } from "@/components/filters-provider";
import { StatusBadge, TrendArrow } from "@/components/indicators";
import { Segmented } from "@/components/segmented";
import { DepartureChart, TourYearChart } from "@/components/charts/tour-charts";
import { DEPARTURES, TOUR_BY_SLUG } from "@/data/seed";
import type { DepartureStatus } from "@/data/types";
import { departureMargin, summarizeTour, tourInsight, tourMatches, yearsInRange } from "@/lib/analytics";
import { fmtDate, fmtInt, fmtMoney, fmtPct } from "@/lib/format";

const negative = "text-[var(--colorStatusDangerForeground1)]";
const muted = "text-[var(--colorNeutralForeground3)]";
const DEP_BADGE: Record<DepartureStatus, "subtle" | "danger" | "brand"> = {
  operated: "subtle",
  cancelled: "danger",
  upcoming: "brand",
};

export function TourDetail({ slug }: { slug: string }) {
  const router = useRouter();
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Breadcrumb aria-label="Breadcrumb">
          <BreadcrumbItem>
            <BreadcrumbButton onClick={() => router.push("/tours")}>Tour comparison</BreadcrumbButton>
          </BreadcrumbItem>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <BreadcrumbButton current>{tour.name}</BreadcrumbButton>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex flex-wrap items-center gap-3">
          <Title2 as="h1">{tour.name}</Title2>
          <StatusBadge status={summary.status} size="large" />
        </div>
        <Body1 className="text-[var(--colorNeutralForeground2)]">
          {tour.region} · {tour.type} · {tour.durationDays} days · avg. ${fmtInt(tour.pricePerPax)} per guest
          {tour.firstYear > 2023 && ` · launched ${tour.firstYear}`}
        </Body1>
        {outsideFilters && (
          <MessageBar intent="info">
            <MessageBarBody>This tour sits outside the current region or type filter; showing it anyway.</MessageBarBody>
          </MessageBar>
        )}
      </header>

      {!summary.years.length ? (
        <Card>
          <Body1 className={`py-10 text-center ${muted}`}>No departures for this tour in the selected years.</Body1>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Tour metrics">
            <Stat
              label="Average load factor"
              value={fmtPct(summary.total.lf, 1)}
              sub={
                <>
                  <Caption1 className={muted}>break-even {fmtPct(summary.total.beLf)}</Caption1>
                  <TrendArrow trend={summary.trend} slope={summary.slope} />
                </>
              }
            />
            <Stat
              label="Departures run / cancelled"
              value={`${summary.total.operated} / ${summary.total.cancelled}`}
              sub={
                <Caption1 className={muted}>
                  {summary.total.upcoming ? `+${summary.total.upcoming} upcoming` : `${summary.total.departures} scheduled`}
                </Caption1>
              }
              bad={summary.total.cancelled > 0}
            />
            <Stat
              label="Cumulative margin"
              value={fmtMoney(summary.total.margin, { signed: true })}
              sub={<Caption1 className={muted}>on {fmtMoney(summary.total.revenue)} revenue</Caption1>}
              bad={summary.total.margin < 0}
            />
            <Stat
              label="Cancellation & rebooking cost"
              value={fmtMoney(summary.total.cancellationCost)}
              sub={
                <Caption1 className={muted}>
                  {summary.total.lowWaterCancelled
                    ? `${summary.total.lowWaterCancelled} low water cancellations`
                    : "attrition fees + rebooking"}
                </Caption1>
              }
              bad={summary.total.cancellationCost > 0}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {insight && (
              <Card className="lg:col-span-2" style={{ background: "var(--colorBrandBackground2)" }}>
                <CardHeader
                  image={<SparkleFilled fontSize={24} className="text-[var(--colorBrandForeground1)]" aria-hidden />}
                  header={
                    <span className="flex items-center gap-2">
                      <Subtitle1 as="h2">AI insight</Subtitle1>
                      <Badge appearance="outline" color="brand" size="small">
                        Demo
                      </Badge>
                    </span>
                  }
                  description={<Caption1 className={muted}>Generated from the sample data with fixed rules</Caption1>}
                />
                <Subtitle2 as="p" className="m-0">
                  {insight.headline}
                </Subtitle2>
                {insight.points.length > 0 && (
                  <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
                    {insight.points.map((p) => (
                      <li key={p}>
                        <Body1>{p}</Body1>
                      </li>
                    ))}
                  </ul>
                )}
                <div
                  className="flex gap-3 rounded-[var(--borderRadiusMedium)] bg-[var(--colorNeutralBackground1)] p-3"
                  style={{ boxShadow: "var(--shadow2)" }}
                >
                  <LightbulbRegular fontSize={20} className="mt-0.5 shrink-0 text-[var(--colorBrandForeground1)]" aria-hidden />
                  <div className="flex flex-col gap-0.5">
                    <Text weight="semibold">Recommendation</Text>
                    <Body1>{insight.recommendation}</Body1>
                  </div>
                </div>
              </Card>
            )}
            <Card className="lg:col-span-3">
              <CardHeader
                header={<Subtitle1 as="h2">Load factor by year</Subtitle1>}
                description={<Caption1 className={muted}>{summary.statusReason}</Caption1>}
              />
              <TourYearChart
                rows={summary.years.map((y) => ({
                  year: String(y),
                  lf: summary.byYear[y]!.lf,
                  beLf: summary.byYear[y]!.beLf,
                  departures: summary.byYear[y]!.departures,
                }))}
              />
            </Card>
          </section>

          <Card>
            <CardHeader
              header={<Subtitle1 as="h2">Departures in {activeYear}</Subtitle1>}
              description={<Caption1 className={muted}>Booked pax against break-even and capacity for each departure</Caption1>}
            />
            {summary.years.length > 1 && (
              <Segmented
                label="Year"
                value={activeYear}
                onChange={setPickedYear}
                options={summary.years.map((y) => ({ value: String(y), label: String(y) }))}
              />
            )}
            <DepartureChart departures={yearDeps} />
            <div className="overflow-x-auto">
              <Table aria-label={`Departures in ${activeYear}`} className="min-w-[760px]">
                <TableHeader className="bg-[var(--colorNeutralBackground2)]">
                  <TableRow>
                    <TableHeaderCell>Departure</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Booked / BE / cap.</TableHeaderCell>
                    <TableHeaderCell>Load factor</TableHeaderCell>
                    <TableHeaderCell>Revenue</TableHeaderCell>
                    <TableHeaderCell>Rebooking cost</TableHeaderCell>
                    <TableHeaderCell>Margin</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearDeps.map((d) => {
                    const m = departureMargin(d);
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <TableCellLayout description={<Caption1 className={muted}>{d.season}</Caption1>}>
                            <span className="tabular">{fmtDate(d.date)}</span>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell>
                          <TableCellLayout
                            description={
                              d.cancellationReason ? <Caption1 className={muted}>{d.cancellationReason}</Caption1> : undefined
                            }
                          >
                            <Badge appearance="tint" color={DEP_BADGE[d.status]} className="capitalize">
                              {d.status}
                            </Badge>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell className="tabular">
                          <Text weight="semibold" className={d.bookedPax < d.breakEvenPax ? negative : ""}>
                            {d.bookedPax}
                          </Text>
                          <span className={muted}>
                            {" "}
                            / {d.breakEvenPax} / {d.capacity}
                          </span>
                        </TableCell>
                        <TableCell className="tabular">{fmtPct(d.bookedPax / d.capacity)}</TableCell>
                        <TableCell className="tabular">{d.revenue ? fmtMoney(d.revenue) : <span className={muted}>n/a</span>}</TableCell>
                        <TableCell className="tabular">
                          {d.rebookingCost ? fmtMoney(d.rebookingCost) : <span className={muted}>n/a</span>}
                        </TableCell>
                        <TableCell>
                          <TableCellLayout
                            description={d.status === "upcoming" ? <Caption1 className={muted}>projected</Caption1> : undefined}
                          >
                            <Text weight="semibold" className={`tabular ${m < 0 ? negative : ""}`}>
                              {fmtMoney(m, { signed: true })}
                            </Text>
                          </TableCellLayout>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, bad }: { label: string; value: string; sub?: React.ReactNode; bad?: boolean }) {
  return (
    <Card appearance="filled" className="gap-1.5">
      <Text size={300} weight="semibold" className="text-[var(--colorNeutralForeground2)]">
        {label}
      </Text>
      <Text size={800} weight="semibold" className={`tabular ${bad ? negative : ""}`}>
        {value}
      </Text>
      {sub && <div className="flex flex-wrap items-center gap-2">{sub}</div>}
    </Card>
  );
}
