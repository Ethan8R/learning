import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

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
    <Card className="gap-2 px-4 py-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold tracking-tight md:text-3xl">{value}</div>
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular",
              good && "text-[var(--text-good)]",
              bad && "text-[var(--text-critical)]",
              !good && !bad && "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {delta}
          </span>
        )}
        <span className="text-muted-foreground">{caption}</span>
      </div>
    </Card>
  );
}
