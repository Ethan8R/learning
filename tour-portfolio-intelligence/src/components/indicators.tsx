"use client";

import { Badge, Caption1, Tooltip, type BadgeProps } from "@fluentui/react-components";
import {
  ArrowTrendingDownRegular,
  ArrowTrendingRegular,
  ArrowRightRegular,
  CheckmarkCircleFilled,
  DismissCircleFilled,
  ErrorCircleFilled,
  EyeRegular,
  WarningFilled,
  WrenchRegular,
} from "@fluentui/react-icons";
import type { Band, TourStatus, Trend } from "@/lib/analytics";
import { bandOf } from "@/lib/analytics";
import { fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS: Record<TourStatus, { color: BadgeProps["color"]; icon: React.ReactElement }> = {
  Keep: { color: "success", icon: <CheckmarkCircleFilled /> },
  Watch: { color: "warning", icon: <EyeRegular /> },
  Rework: { color: "severe", icon: <WrenchRegular /> },
  "Retire candidate": { color: "danger", icon: <DismissCircleFilled /> },
};

export function StatusBadge({ status, size = "medium" }: { status: TourStatus; size?: BadgeProps["size"] }) {
  const { color, icon } = STATUS[status];
  return (
    <Badge appearance="tint" color={color} icon={icon} size={size} className="whitespace-nowrap">
      {status}
    </Badge>
  );
}

export function TrendArrow({ trend, slope }: { trend: Trend; slope: number }) {
  const Icon = trend === "up" ? ArrowTrendingRegular : trend === "down" ? ArrowTrendingDownRegular : ArrowRightRegular;
  const label = `${slope >= 0 ? "+" : "−"}${Math.abs(slope * 100).toFixed(1)} pts/yr`;
  const color =
    trend === "up"
      ? "var(--colorStatusSuccessForeground1)"
      : trend === "down"
        ? "var(--colorStatusDangerForeground1)"
        : "var(--colorNeutralForeground3)";
  return (
    <Tooltip content={`Load factor trend: ${label}`} relationship="description">
      <span className="inline-flex items-center gap-1 tabular" style={{ color }}>
        <Icon fontSize={18} aria-hidden />
        <Caption1 className="hidden lg:inline" style={{ color }}>
          {label}
        </Caption1>
        <span className="sr-only lg:hidden">{label}</span>
      </span>
    </Tooltip>
  );
}

const BAND: Record<Band, { bg: string; label: string; icon: React.ReactElement }> = {
  below: { bg: "var(--cell-below)", label: "Below break-even", icon: <ErrorCircleFilled /> },
  near: { bg: "var(--cell-near)", label: "Within 5 pts of break-even", icon: <WarningFilled /> },
  above: { bg: "var(--cell-above)", label: "Above break-even", icon: <CheckmarkCircleFilled /> },
};

/** Heatmap cell: load factor tinted by its position against break-even. */
export function LfCell({ lf, beLf, compact }: { lf?: number; beLf?: number; compact?: boolean }) {
  if (lf === undefined || beLf === undefined) {
    return (
      <div
        className="grid h-10 place-items-center rounded-[var(--borderRadiusMedium)] border border-dashed border-[var(--colorNeutralStroke1)] text-[var(--colorNeutralForeground3)]"
        title="Not on sale this year"
      >
        <Caption1>Not sold</Caption1>
      </div>
    );
  }
  const band = bandOf(lf, beLf);
  const { bg, label } = BAND[band];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--borderRadiusMedium)] text-[var(--colorNeutralForeground1)]",
        compact ? "h-8" : "h-10",
      )}
      style={{ background: bg }}
      title={`${label}. Load factor ${fmtPct(lf)}, break-even ${fmtPct(beLf)}`}
    >
      <span className="text-[13px] leading-4 font-semibold tabular">{fmtPct(lf)}</span>
      {!compact && <span className="text-[10px] leading-3 text-[var(--colorNeutralForeground2)] tabular">BE {fmtPct(beLf)}</span>}
    </div>
  );
}

export function BandLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {(Object.keys(BAND) as Band[]).map((b) => (
        <span key={b} className="inline-flex items-center gap-1.5">
          <span
            className="inline-grid size-4 place-items-center rounded-[var(--borderRadiusSmall)] text-[10px] text-[var(--colorNeutralForeground2)]"
            style={{ background: BAND[b].bg }}
            aria-hidden
          >
            {BAND[b].icon}
          </span>
          <Caption1 className="text-[var(--colorNeutralForeground2)]">{BAND[b].label}</Caption1>
        </span>
      ))}
    </div>
  );
}
