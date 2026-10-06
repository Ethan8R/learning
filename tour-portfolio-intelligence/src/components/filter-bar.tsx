"use client";

import { Button, Caption1, Dropdown, Field, Option } from "@fluentui/react-components";
import { ArrowResetRegular } from "@fluentui/react-icons";
import { useFilters } from "@/components/filters-provider";
import { AS_OF, REGIONS, TOUR_TYPES, YEARS, type Year } from "@/data/seed";
import { DEFAULT_FILTERS, type Filters } from "@/lib/analytics";
import { fmtDate } from "@/lib/format";

const regionItems: Record<string, string> = { All: "All regions", ...Object.fromEntries(REGIONS.map((r) => [r, r])) };
const typeItems: Record<string, string> = { All: "All tour types", ...Object.fromEntries(TOUR_TYPES.map((t) => [t, t])) };
const yearItems: Record<string, string> = Object.fromEntries(YEARS.map((y) => [String(y), String(y)]));

function FilterDropdown({
  label,
  value,
  items,
  onChange,
  width,
}: {
  label: string;
  value: string;
  items: Record<string, string>;
  onChange: (v: string) => void;
  width: number;
}) {
  return (
    <Field label={label} size="small">
      <Dropdown
        size="medium"
        value={items[value]}
        selectedOptions={[value]}
        onOptionSelect={(_, d) => d.optionValue && onChange(d.optionValue)}
        style={{ minWidth: width, width }}
      >
        {Object.entries(items).map(([v, l]) => (
          <Option key={v} value={v}>
            {l}
          </Option>
        ))}
      </Dropdown>
    </Field>
  );
}

export function FilterBar() {
  const { filters, setFilters, reset } = useFilters();
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground2)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-end gap-x-4 gap-y-2 px-4 py-3 md:px-8" role="search" aria-label="Global filters">
        <FilterDropdown
          label="From"
          value={String(filters.yearFrom)}
          items={yearItems}
          onChange={(v) => setFilters({ yearFrom: Number(v) as Year })}
          width={104}
        />
        <FilterDropdown
          label="To"
          value={String(filters.yearTo)}
          items={yearItems}
          onChange={(v) => setFilters({ yearTo: Number(v) as Year })}
          width={104}
        />
        <FilterDropdown
          label="Region"
          value={filters.region}
          items={regionItems}
          onChange={(v) => setFilters({ region: v as Filters["region"] })}
          width={232}
        />
        <FilterDropdown
          label="Tour type"
          value={filters.type}
          items={typeItems}
          onChange={(v) => setFilters({ type: v as Filters["type"] })}
          width={192}
        />
        {dirty && (
          <Button appearance="subtle" icon={<ArrowResetRegular />} onClick={reset}>
            Reset filters
          </Button>
        )}
        <Caption1 className="ml-auto max-w-[19rem] pb-1.5 text-right text-[var(--colorNeutralForeground3)]">
          Data as of {fmtDate(AS_OF)}. 2026 includes upcoming departures at current bookings.
        </Caption1>
      </div>
    </div>
  );
}
