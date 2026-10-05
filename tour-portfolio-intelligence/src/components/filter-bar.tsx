"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilters } from "@/components/filters-provider";
import { AS_OF, REGIONS, TOUR_TYPES, YEARS, type Year } from "@/data/seed";
import { DEFAULT_FILTERS, type Filters } from "@/lib/analytics";
import { fmtDate } from "@/lib/format";

const yearItems = Object.fromEntries(YEARS.map((y) => [String(y), String(y)]));
const regionItems = { All: "All regions", ...Object.fromEntries(REGIONS.map((r) => [r, r])) };
const typeItems = { All: "All tour types", ...Object.fromEntries(TOUR_TYPES.map((t) => [t, t])) };

function FilterSelect({
  label,
  value,
  items,
  onChange,
  className,
  hideLabel,
}: {
  label: string;
  hideLabel?: boolean;
  value: string;
  items: Record<string, string>;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <span className={hideLabel ? "sr-only" : "sr-only sm:not-sr-only"}>{label}</span>
      <Select value={value} items={items} onValueChange={(v) => v && onChange(String(v))}>
        <SelectTrigger size="sm" className={className} aria-label={label}>
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
    </label>
  );
}

export function FilterBar() {
  const { filters, setFilters, reset } = useFilters();
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  return (
    <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-2">
          <FilterSelect
            label="Years"
            value={String(filters.yearFrom)}
            items={yearItems}
            onChange={(v) => setFilters({ yearFrom: Number(v) as Year })}
            className="w-[5.5rem] text-foreground"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <FilterSelect
            label="To year"
            hideLabel
            value={String(filters.yearTo)}
            items={yearItems}
            onChange={(v) => setFilters({ yearTo: Number(v) as Year })}
            className="w-[5.5rem] text-foreground"
          />
        </div>
        <FilterSelect
          label="Region"
          value={filters.region}
          items={regionItems}
          onChange={(v) => setFilters({ region: v as Filters["region"] })}
          className="w-[13rem] text-foreground"
        />
        <FilterSelect
          label="Type"
          value={filters.type}
          items={typeItems}
          onChange={(v) => setFilters({ type: v as Filters["type"] })}
          className="w-[11rem] text-foreground"
        />
        {dirty && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw aria-hidden />
            Reset
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          Data as of {fmtDate(AS_OF)} · 2026 includes upcoming departures at current bookings
        </span>
      </div>
    </div>
  );
}
