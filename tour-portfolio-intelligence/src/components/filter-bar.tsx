"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilters } from "@/components/filters-provider";
import { AS_OF, REGIONS, TOUR_TYPES, YEARS, type Year } from "@/data/seed";
import { DEFAULT_FILTERS, type Filters } from "@/lib/analytics";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const regionItems = { All: "All regions", ...Object.fromEntries(REGIONS.map((r) => [r, r])) };
const typeItems = { All: "All tour types", ...Object.fromEntries(TOUR_TYPES.map((t) => [t, t])) };

function FilterSelect({
  label,
  value,
  items,
  onChange,
  className,
}: {
  label: string;
  value: string;
  items: Record<string, string>;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow" aria-hidden>
        {label}
      </span>
      <Select value={value} items={items} onValueChange={(v) => v && onChange(String(v))}>
        <SelectTrigger aria-label={label} className={cn("h-10 bg-card text-sm data-[size=default]:h-10", className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          {Object.entries(items).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Season range as a route line: four stops, the selected stretch drawn in brass.
 * Click once to pick a single year, click a second stop to extend the range.
 */
function YearRoute() {
  const { filters, setFilters } = useFilters();
  const [anchor, setAnchor] = useState<Year | null>(null);
  const idx = (y: Year) => YEARS.indexOf(y);
  const from = idx(filters.yearFrom);
  const to = idx(filters.yearTo);
  const pct = (i: number) => (i / (YEARS.length - 1)) * 100;

  const pick = (y: Year) => {
    if (anchor === null) {
      setFilters({ yearFrom: y, yearTo: y });
      setAnchor(y);
    } else {
      setFilters({ yearFrom: Math.min(anchor, y) as Year, yearTo: Math.max(anchor, y) as Year });
      setAnchor(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow" id="season-label">
        Seasons {anchor !== null && <span className="text-brass normal-case tracking-normal">· pick an end year</span>}
      </span>
      <div className="relative h-10 w-[15rem]" role="group" aria-labelledby="season-label">
        <div className="absolute top-[13px] right-[22px] left-[22px] h-px bg-[var(--chart-baseline)]">
          <div
            className="absolute -top-px h-[3px] rounded-full bg-brass transition-all duration-300 ease-[var(--ease-out)]"
            style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%` }}
          />
        </div>
        <div className="absolute inset-x-0 top-0 flex justify-between">
          {YEARS.map((y, i) => {
            const on = i >= from && i <= to;
            return (
              <button
                key={y}
                type="button"
                onClick={() => pick(y)}
                aria-pressed={on}
                aria-label={`${y}${on ? ", in range" : ""}`}
                className="group flex h-10 w-11 flex-col items-center gap-0.5 rounded-md"
              >
                <span
                  className={cn(
                    "mt-[7px] size-3 rounded-full border-2 transition-colors duration-200",
                    on ? "border-brass bg-brass" : "border-[var(--chart-baseline)] bg-card group-hover:border-ink",
                    anchor === y && "ring-4 ring-brass/25",
                  )}
                />
                <span className={cn("font-mono text-[0.6875rem] tabular", on ? "text-ink font-medium" : "text-muted-foreground")}>
                  {y}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FilterBar() {
  const { filters, setFilters, reset } = useFilters();
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  return (
    <div className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-end gap-x-6 gap-y-3 px-4 py-3 md:px-8">
        <YearRoute />
        <FilterSelect
          label="Region"
          value={filters.region}
          items={regionItems}
          onChange={(v) => setFilters({ region: v as Filters["region"] })}
          className="w-[13.5rem]"
        />
        <FilterSelect
          label="Tour type"
          value={filters.type}
          items={typeItems}
          onChange={(v) => setFilters({ type: v as Filters["type"] })}
          className="w-[11.5rem]"
        />
        {dirty && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset filters
          </button>
        )}
        <p className="ml-auto max-w-[17rem] pb-1 text-right text-xs leading-snug text-muted-foreground">
          Data as of <span className="font-mono">{fmtDate(AS_OF)}</span>. 2026 includes upcoming departures at current bookings.
        </p>
      </div>
    </div>
  );
}
