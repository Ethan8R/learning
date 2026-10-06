"use client";

import type { ReactNode } from "react";

/** Shared chart chrome so every chart reads as one Fluent system. */
export const AXIS = {
  stroke: "var(--chart-baseline)",
  tick: { fill: "var(--chart-axis)", fontSize: 12, fontFamily: "var(--fontFamilyBase)" },
  tickLine: false,
} as const;

export const GRID = { stroke: "var(--chart-grid)", strokeDasharray: "0", vertical: false } as const;

export const pctTick = (v: number) => `${Math.round(v * 100)}%`;

/** Matches the Fluent Tooltip/Popover surface: white, shadow16, medium radius. */
export function TooltipCard({
  title,
  rows,
}: {
  title: ReactNode;
  rows: { label: ReactNode; value: ReactNode; swatch?: string; dashed?: boolean }[];
}) {
  return (
    <div
      className="min-w-48 rounded-[var(--borderRadiusMedium)] bg-[var(--colorNeutralBackground1)] px-3 py-2 text-[12px] leading-4 text-[var(--colorNeutralForeground1)]"
      style={{ boxShadow: "var(--shadow16)", fontFamily: "var(--fontFamilyBase)" }}
    >
      <div className="mb-1.5 font-semibold">{title}</div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[var(--colorNeutralForeground2)]">
              {r.swatch && (
                <span
                  className="inline-block"
                  style={
                    r.dashed
                      ? { borderTop: `2px dashed ${r.swatch}`, width: 12 }
                      : { background: r.swatch, height: 8, width: 8, borderRadius: 2 }
                  }
                />
              )}
              {r.label}
            </span>
            <span className="font-semibold tabular">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LegendItem({ color, label, kind = "box" }: { color: string; label: string; kind?: "box" | "line" | "dash" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] leading-4 text-[var(--colorNeutralForeground2)]">
      {kind === "box" ? (
        <span className="inline-block size-2.5 rounded-[2px]" style={{ background: color }} />
      ) : (
        <span className="inline-block w-4" style={{ borderTop: `2px ${kind === "dash" ? "dashed" : "solid"} ${color}` }} />
      )}
      {label}
    </span>
  );
}
