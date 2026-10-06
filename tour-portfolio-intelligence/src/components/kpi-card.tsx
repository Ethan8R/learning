"use client";

import { Badge, Caption1, Card, LargeTitle, Text } from "@fluentui/react-components";
import { ArrowDownRegular, ArrowUpRegular, SubtractRegular } from "@fluentui/react-icons";
import { Sparkline } from "@/components/charts/sparkline";

export function KpiCard({
  label,
  value,
  delta,
  deltaDirection,
  goodWhen,
  caption,
  spark,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  /** Sign of the change, independent of whether it is good. */
  deltaDirection?: "up" | "down" | "flat";
  goodWhen: "up" | "down";
  caption: string;
  spark?: number[];
  icon?: React.ReactElement;
}) {
  const good = deltaDirection && deltaDirection !== "flat" && deltaDirection === goodWhen;
  const bad = deltaDirection && deltaDirection !== "flat" && deltaDirection !== goodWhen;
  const Icon = deltaDirection === "up" ? ArrowUpRegular : deltaDirection === "down" ? ArrowDownRegular : SubtractRegular;
  return (
    <Card className="gap-2" appearance="filled">
      <div className="flex items-center gap-2 text-[var(--colorNeutralForeground3)]">
        {icon && <span className="grid size-6 place-items-center rounded-[var(--borderRadiusMedium)] bg-[var(--colorBrandBackground2)] text-[var(--colorBrandForeground1)]">{icon}</span>}
        <Text size={300} weight="semibold" className="text-[var(--colorNeutralForeground2)]">
          {label}
        </Text>
      </div>
      <div className="flex items-end justify-between gap-3">
        <LargeTitle className="tabular">{value}</LargeTitle>
        {spark && spark.length > 1 && (
          <Sparkline values={spark} color={bad ? "var(--status-critical)" : "var(--series-1)"} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta && (
          <Badge
            appearance="tint"
            color={good ? "success" : bad ? "danger" : "subtle"}
            icon={<Icon />}
            className="tabular"
          >
            {delta}
            <span className="sr-only">{good ? " (improvement)" : bad ? " (deterioration)" : ""}</span>
          </Badge>
        )}
        <Caption1 className="text-[var(--colorNeutralForeground3)]">{caption}</Caption1>
      </div>
    </Card>
  );
}
