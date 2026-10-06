"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Body1,
  Caption1,
  Card,
  SearchBox,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
  ToggleButton,
} from "@fluentui/react-components";
import { useFilters } from "@/components/filters-provider";
import { BandLegend, LfCell, StatusBadge, TrendArrow } from "@/components/indicators";
import { summarizeTours, yearsInRange, type TourStatus, type TourSummary } from "@/lib/analytics";
import { fmtMoney } from "@/lib/format";

const STATUSES: TourStatus[] = ["Keep", "Watch", "Rework", "Retire candidate"];
const STATUS_RANK: Record<TourStatus, number> = { Keep: 0, Watch: 1, Rework: 2, "Retire candidate": 3 };
const negative = "text-[var(--colorStatusDangerForeground1)]";

type SortKey = "name" | "trend" | "runs" | "cancelled" | "margin" | "status" | `y${number}`;
type SortState = { key: SortKey; dir: "ascending" | "descending" };

export default function ToursPage() {
  return (
    <Suspense>
      <ToursTable />
    </Suspense>
  );
}

function ToursTable() {
  const router = useRouter();
  const params = useSearchParams();
  const { filters } = useFilters();
  const years = yearsInRange(filters);
  const [query, setQuery] = useState("");
  const initialStatus = params.get("status") as TourStatus | null;
  const [status, setStatus] = useState<TourStatus | "All">(
    initialStatus && STATUSES.includes(initialStatus) ? initialStatus : "All",
  );
  const [sort, setSort] = useState<SortState>({ key: "status", dir: "descending" });

  const summaries = useMemo(() => summarizeTours(filters), [filters]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const value = (s: TourSummary): number | string => {
      switch (sort.key) {
        case "name":
          return s.tour.name;
        case "trend":
          return s.slope;
        case "runs":
          return s.total.operated;
        case "cancelled":
          return s.total.cancelled;
        case "margin":
          return s.total.margin;
        case "status":
          return STATUS_RANK[s.status] * 1e9 - s.total.margin / 1e3;
        default:
          return s.byYear[Number(sort.key.slice(1)) as keyof typeof s.byYear]?.lf ?? -1;
      }
    };
    return summaries
      .filter((s) => status === "All" || s.status === status)
      .filter(
        (s) =>
          !q ||
          s.tour.name.toLowerCase().includes(q) ||
          s.tour.region.toLowerCase().includes(q) ||
          s.tour.type.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const va = value(a);
        const vb = value(b);
        const c = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        return sort.dir === "ascending" ? c : -c;
      });
  }, [summaries, query, status, sort]);

  const headProps = (key: SortKey) => ({
    sortDirection: sort.key === key ? sort.dir : undefined,
    onClick: () =>
      setSort((s) =>
        s.key === key
          ? { key, dir: s.dir === "ascending" ? "descending" : "ascending" }
          : { key, dir: key === "name" ? "ascending" : "descending" },
      ),
  });

  const counts = Object.fromEntries(STATUSES.map((s) => [s, summaries.filter((x) => x.status === s).length]));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Title2 as="h1">Tour comparison</Title2>
          <Body1 className="text-[var(--colorNeutralForeground2)]">
            Every tour side by side. Load factor per year, coloured against each tour&apos;s break-even. Select a row
            for departure-level detail.
          </Body1>
        </div>
        <BandLegend />
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          value={query}
          onChange={(_, d) => setQuery(d.value)}
          placeholder="Search tours, regions, types"
          aria-label="Search tours"
          className="w-full sm:w-80"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {(["All", ...STATUSES] as const).map((s) => (
            <ToggleButton
              key={s}
              shape="circular"
              size="small"
              checked={status === s}
              appearance={status === s ? "primary" : "secondary"}
              onClick={() => setStatus(s)}
            >
              {s} ({s === "All" ? summaries.length : counts[s]})
            </ToggleButton>
          ))}
        </div>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table sortable aria-label="Tour comparison" className="min-w-[960px]">
            <TableHeader className="bg-[var(--colorNeutralBackground2)]">
              <TableRow>
                <TableHeaderCell {...headProps("name")} style={{ width: "26%" }}>
                  Tour
                </TableHeaderCell>
                {years.map((y) => (
                  <TableHeaderCell key={y} {...headProps(`y${y}`)} style={{ width: 92 }}>
                    {y}
                  </TableHeaderCell>
                ))}
                <TableHeaderCell {...headProps("trend")} style={{ width: 130 }}>
                  Trend
                </TableHeaderCell>
                <TableHeaderCell {...headProps("runs")} style={{ width: 120 }}>
                  Run / cancelled
                </TableHeaderCell>
                <TableHeaderCell {...headProps("margin")} style={{ width: 120 }}>
                  Cum. margin
                </TableHeaderCell>
                <TableHeaderCell {...headProps("status")} style={{ width: 210 }}>
                  Status
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow
                  key={s.tour.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/tours/${s.tour.slug}`)}
                >
                  <TableCell>
                    <TableCellLayout
                      description={
                        <Caption1 className="text-[var(--colorNeutralForeground3)]">
                          {s.tour.region} · {s.tour.type}
                        </Caption1>
                      }
                    >
                      <Link
                        href={`/tours/${s.tour.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-[var(--colorNeutralForeground1)] no-underline hover:underline"
                      >
                        {s.tour.name}
                      </Link>
                    </TableCellLayout>
                  </TableCell>
                  {years.map((y) => (
                    <TableCell key={y} className="py-1.5">
                      <LfCell lf={s.byYear[y]?.lf} beLf={s.byYear[y]?.beLf} />
                    </TableCell>
                  ))}
                  <TableCell>
                    <TrendArrow trend={s.trend} slope={s.slope} />
                  </TableCell>
                  <TableCell>
                    <TableCellLayout
                      description={
                        s.total.upcoming > 0 ? (
                          <Caption1 className="text-[var(--colorNeutralForeground3)]">+{s.total.upcoming} upcoming</Caption1>
                        ) : undefined
                      }
                    >
                      <span className="tabular">
                        {s.total.operated} /{" "}
                        <span className={s.total.cancelled ? `font-semibold ${negative}` : "text-[var(--colorNeutralForeground3)]"}>
                          {s.total.cancelled}
                        </span>
                      </span>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <Text weight="semibold" className={`tabular ${s.total.margin < 0 ? negative : ""}`}>
                      {fmtMoney(s.total.margin, { signed: true })}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout
                      description={
                        <Caption1 className="text-[var(--colorNeutralForeground3)]">{s.statusReason}</Caption1>
                      }
                    >
                      <StatusBadge status={s.status} />
                    </TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={years.length + 5}>
                    <Body1 className="block py-10 text-center text-[var(--colorNeutralForeground3)]">
                      No tours match. Try clearing the search or widening the filters.
                    </Body1>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Caption1 className="text-[var(--colorNeutralForeground3)]">
        Showing {rows.length} of {summaries.length} tours. Cumulative margin = revenue − contracted cost − rebooking cost
        across the selected years, including projected margin on upcoming departures.
      </Caption1>
    </div>
  );
}
