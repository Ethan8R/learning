"use client";

import { Tab, TabList } from "@fluentui/react-components";

/** View switcher for charts, built on Fluent's small subtle-circular TabList. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <TabList
      size="small"
      appearance="subtle-circular"
      selectedValue={value}
      onTabSelect={(_, d) => onChange(d.value as T)}
      aria-label={label}
    >
      {options.map((o) => (
        <Tab key={o.value} value={o.value}>
          {o.label}
        </Tab>
      ))}
    </TabList>
  );
}
