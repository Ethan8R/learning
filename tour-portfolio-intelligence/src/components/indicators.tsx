import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleAlert, CircleCheck, CircleMinus, Eye, Wrench } from "lucide-react";
import type { Band, TourStatus, Trend } from "@/lib/analytics";
import { bandOf } from "@/lib/analytics";
import { fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<TourStatus, { cls: string; icon: typeof Eye }> = {
  Keep: { cls: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CircleCheck },
  Watch: { cls: "border-amber-200 bg-amber-50 text-amber-900", icon: Eye },
  Rework: { cls: "border-orange-200 bg-orange-50 text-orange-900", icon: Wrench },
  "Retire candidate": { cls: "border-red-200 bg-red-50 text-red-900", icon: CircleAlert },
};

export function StatusBadge({ status, className }: { status: TourStatus; className?: string }) {
  const { cls, icon: Icon } = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        cls,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {status}
    </span>
  );
}

export function TrendArrow({ trend, slope }: { trend: Trend; slope: number }) {
  const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : ArrowRight;
  const label = `${slope >= 0 ? "+" : "−"}${Math.abs(slope * 100).toFixed(1)} pts/yr`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular",
        trend === "up" ? "text-[var(--text-good)]" : trend === "down" ? "text-[var(--text-critical)]" : "text-muted-foreground",
      )}
      title={`Load factor trend: ${label}`}
    >
      <Icon className="size-4" aria-hidden />
      <span className="hidden lg:inline">{label}</span>
      <span className="sr-only lg:hidden">{label}</span>
    </span>
  );
}

const BAND_STYLE: Record<Band, { bg: string; label: string; icon: typeof Eye }> = {
  below: { bg: "var(--cell-below)", label: "Below break-even", icon: CircleAlert },
  near: { bg: "var(--cell-near)", label: "Within 5 pts of break-even", icon: CircleMinus },
  above: { bg: "var(--cell-above)", label: "Above break-even", icon: CircleCheck },
};

/** Heatmap cell: load factor tinted by its position against break-even. */
export function LfCell({ lf, beLf, compact }: { lf?: number; beLf?: number; compact?: boolean }) {
  if (lf === undefined || beLf === undefined) {
    return (
      <div className="grid h-10 place-items-center rounded-md bg-muted/50 text-xs text-muted-foreground" title="Not on sale">
        n/a
      </div>
    );
  }
  const band = bandOf(lf, beLf);
  const { bg, label } = BAND_STYLE[band];
  return (
    <div
      className={cn("flex h-10 flex-col items-center justify-center rounded-md text-foreground", compact && "h-9")}
      style={{ background: bg }}
      title={`${label}. Load factor ${fmtPct(lf)}, break-even ${fmtPct(beLf)}`}
    >
      <span className="text-sm font-semibold tabular">{fmtPct(lf)}</span>
      {!compact && <span className="text-[10px] leading-none text-foreground/60 tabular">BE {fmtPct(beLf)}</span>}
    </div>
  );
}

export function BandLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {(Object.keys(BAND_STYLE) as Band[]).map((b) => {
        const { bg, label, icon: Icon } = BAND_STYLE[b];
        return (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span className="inline-grid size-4 place-items-center rounded" style={{ background: bg }}>
              <Icon className="size-3 text-foreground/70" aria-hidden />
            </span>
            {label}
          </span>
        );
      })}
    </div>
  );
}
