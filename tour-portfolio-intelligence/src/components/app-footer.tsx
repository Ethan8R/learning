"use client";

import { Caption1 } from "@fluentui/react-components";

export function AppFooter() {
  return (
    <footer className="border-t border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-2 px-4 py-3 md:px-8">
        <Caption1 className="text-[var(--colorNeutralForeground3)]">Tour Portfolio Intelligence · Prospect demo</Caption1>
        <Caption1 className="text-[var(--colorNeutralForeground3)]">
          All tours, departures and figures are generated sample data, not real results.
        </Caption1>
      </div>
    </footer>
  );
}
