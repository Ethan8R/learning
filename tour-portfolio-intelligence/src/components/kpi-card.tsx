import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

/** One column of the KPI ledger. Rendered inside a shared panel with vertical rules. */
export function KpiCard({
  label,
  value,
  delta,
  deltaDirection,
  goodWhen,
  caption,
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  /** Sign of the change, independent of whether it is good. */
  deltaDirection?: "up" | "down" | "flat";
  goodWhen: "up" | "down";
  caption: string;
  spark?: number[];
}) {
  const good = deltaDirection && deltaDirection !== "flat" && deltaDirection === goodWhen;
  const bad = deltaDirection && deltaDirection !== "flat" && deltaDirection !== goodWhen;
  const Icon = deltaDirection === "up" ? ArrowUpRight : deltaDirection === "down" ? ArrowDownRight : Minus;
  return (
    <div className="flex flex-col gap-3 bg-card p-5">
      <div className="eyebrow">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="font-display text-[2.75rem] leading-none text-ink">{value}</div>
        {spark && spark.length > 1 && <Sparkline values={spark} color={bad ? "var(--status-critical)" : "var(--river)"} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono font-medium tabular",
              good && "bg-[var(--cell-above)] text-[var(--text-good)]",
              bad && "bg-[var(--cell-below)] text-[var(--text-critical)]",
              !good && !bad && "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {delta}
            <span className="sr-only">{good ? "(improvement)" : bad ? "(deterioration)" : ""}</span>
          </span>
        )}
        <span className="text-muted-foreground">{caption}</span>
      </div>
    </div>
  );
}
