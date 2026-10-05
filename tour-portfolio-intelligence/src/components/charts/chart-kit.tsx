"use client";

import type { ReactNode } from "react";

/** Shared chart chrome so every chart reads as one system. */
export const AXIS = {
  stroke: "var(--chart-baseline)",
  tick: { fill: "var(--chart-axis)", fontSize: 11 },
  tickLine: false,
} as const;

export const GRID = { stroke: "var(--chart-grid)", strokeDasharray: "0", vertical: false } as const;

export const pctTick = (v: number) => `${Math.round(v * 100)}%`;

export function TooltipCard({ title, rows }: { title: ReactNode; rows: { label: ReactNode; value: ReactNode; swatch?: string; dashed?: boolean }[] }) {
  return (
    <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1.5 font-medium text-foreground">{title}</div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.swatch && (
                <span
                  className="inline-block h-0.5 w-3"
                  style={
                    r.dashed
                      ? { borderTop: `2px dashed ${r.swatch}` }
                      : { background: r.swatch, height: 8, width: 8, borderRadius: 2 }
                  }
                />
              )}
              {r.label}
            </span>
            <span className="font-medium text-foreground tabular">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LegendItem({ color, label, kind = "box" }: { color: string; label: string; kind?: "box" | "line" | "dash" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {kind === "box" ? (
        <span className="inline-block size-2.5 rounded-[3px]" style={{ background: color }} />
      ) : (
        <span
          className="inline-block w-4"
          style={{ borderTop: `2px ${kind === "dash" ? "dashed" : "solid"} ${color}` }}
        />
      )}
      {label}
    </span>
  );
}
