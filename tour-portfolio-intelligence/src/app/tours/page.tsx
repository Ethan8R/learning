"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFilters } from "@/components/filters-provider";
import { BandLegend, LfCell, StatusBadge, TrendArrow } from "@/components/indicators";
import { summarizeTours, yearsInRange, type TourStatus, type TourSummary } from "@/lib/analytics";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUSES: TourStatus[] = ["Keep", "Watch", "Rework", "Retire candidate"];
const STATUS_RANK: Record<TourStatus, number> = { Keep: 0, Watch: 1, Rework: 2, "Retire candidate": 3 };

type SortKey = "name" | "trend" | "runs" | "cancelled" | "margin" | "status" | `y${number}`;

export default function ToursPage() {
  return (
    <Suspense>
      <ToursTable />
    </Suspense>
  );
}

type SortState = { key: SortKey; dir: "asc" | "desc" };

function SortHead({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </TableHead>
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
  const [sort, setSort] = useState<SortState>({ key: "status", dir: "desc" });

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
        return sort.dir === "asc" ? c : -c;
      });
  }, [summaries, query, status, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  const counts = Object.fromEntries(STATUSES.map((s) => [s, summaries.filter((x) => x.status === s).length]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Tour comparison</h1>
          <p className="text-sm text-muted-foreground">
            Every tour side by side. Load factor per year, coloured against that tour&apos;s break-even. Click a row
            for detail.
          </p>
        </div>
        <BandLegend />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tours, regions, types"
            className="pl-8"
            aria-label="Search tours"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {(["All", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                status === s ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
              <span className="ml-1 opacity-70 tabular">{s === "All" ? summaries.length : counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead sort={sort} onSort={toggleSort} k="name" className="min-w-56 pl-4">Tour</SortHead>
                {years.map((y) => (
                  <SortHead sort={sort} onSort={toggleSort} key={y} k={`y${y}`} className="w-24 text-center">
                    {y}
                  </SortHead>
                ))}
                <SortHead sort={sort} onSort={toggleSort} k="trend">Trend</SortHead>
                <SortHead sort={sort} onSort={toggleSort} k="runs" className="text-right">Run / cancelled</SortHead>
                <SortHead sort={sort} onSort={toggleSort} k="margin" className="text-right">Cum. margin</SortHead>
                <SortHead sort={sort} onSort={toggleSort} k="status" className="pr-4">Status</SortHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow
                  key={s.tour.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/tours/${s.tour.slug}`)}
                >
                  <TableCell className="pl-4">
                    <Link
                      href={`/tours/${s.tour.slug}`}
                      className="font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {s.tour.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {s.tour.region} · {s.tour.type}
                    </div>
                  </TableCell>
                  {years.map((y) => (
                    <TableCell key={y} className="px-1.5">
                      <LfCell lf={s.byYear[y]?.lf} beLf={s.byYear[y]?.beLf} />
                    </TableCell>
                  ))}
                  <TableCell>
                    <TrendArrow trend={s.trend} slope={s.slope} />
                  </TableCell>
                  <TableCell className="text-right tabular">
                    {s.total.operated}
                    <span className="text-muted-foreground"> / </span>
                    <span className={s.total.cancelled ? "font-medium text-[var(--text-critical)]" : "text-muted-foreground"}>
                      {s.total.cancelled}
                    </span>
                    {s.total.upcoming > 0 && (
                      <div className="text-[11px] text-muted-foreground">+{s.total.upcoming} upcoming</div>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn("text-right font-medium tabular", s.total.margin < 0 && "text-[var(--text-critical)]")}
                  >
                    {fmtMoney(s.total.margin, { signed: true })}
                  </TableCell>
                  <TableCell className="pr-4">
                    <StatusBadge status={s.status} />
                    <div className="mt-1 max-w-52 text-[11px] leading-snug whitespace-normal text-muted-foreground">
                      {s.statusReason}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={years.length + 5} className="py-12 text-center text-muted-foreground">
                    No tours match. Try clearing the search or widening the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {summaries.length} tours. Cumulative margin = revenue − contracted cost − rebooking
        cost across the selected years, including projected margin on upcoming departures.
      </p>
    </div>
  );
}
