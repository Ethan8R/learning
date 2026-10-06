"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Avatar,
  Badge,
  Body1,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  MessageBar,
  MessageBarBody,
  OverlayDrawer,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import { DismissRegular, SendRegular, SparkleFilled, SparkleRegular } from "@fluentui/react-icons";
import { useFilters } from "@/components/filters-provider";
import { AXIS, GRID, LegendItem, TooltipCard, pctTick } from "@/components/charts/chart-kit";
import {
  ALL_FILTERS,
  cancellationsByYear,
  regionConsistency,
  riverQuarterly,
  summarizeTours,
  upsideTours,
} from "@/lib/analytics";
import { fmtChange, fmtMoney, fmtPct } from "@/lib/format";

interface Answer {
  text: ReactNode;
  visual?: ReactNode;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  text: ReactNode;
  visual?: ReactNode;
}

const SUGGESTIONS: { q: string; answer: () => Answer }[] = [
  { q: "Which tours should we drop from the 2028 portfolio?", answer: dropCandidates },
  { q: "Which regions have the most consistent load factors?", answer: regionAnswer },
  { q: "What did cancellations cost us in 2026?", answer: cancellationAnswer },
  { q: "How badly did low water hit the Rhine and Danube?", answer: lowWaterAnswer },
  { q: "Where should we add departures?", answer: upsideAnswer },
];

export function AskPanel() {
  const { askOpen, setAskOpen } = useFilters();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: q }]);
    setInput("");
    setThinking(true);
    const match = SUGGESTIONS.find((s) => s.q.toLowerCase() === q.toLowerCase());
    window.setTimeout(() => {
      const a: Answer = match
        ? match.answer()
        : {
            text: (
              <>
                Thanks for the question. In this demo I can only answer the suggested questions below. In the full
                product, free-text questions like this would be answered directly against your live booking,
                contracting and finance data.
              </>
            ),
          };
      setMessages((m) => [...m, { id: nextId.current++, role: "assistant", ...a }]);
      setThinking(false);
    }, 650);
  };

  const asked = new Set(messages.filter((m) => m.role === "user").map((m) => String(m.text)));
  const remaining = SUGGESTIONS.filter((s) => !asked.has(s.q));

  return (
    <OverlayDrawer
      position="end"
      size="medium"
      open={askOpen}
      onOpenChange={(_, d) => setAskOpen(d.open)}
      style={{ width: "min(540px, 100vw)" }}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<DismissRegular />} onClick={() => setAskOpen(false)} />}
        >
          <span className="flex items-center gap-2">
            <SparkleFilled className="text-[var(--colorBrandForeground1)]" aria-hidden />
            Ask the data
            <Badge appearance="tint" color="brand">
              Demo
            </Badge>
          </span>
        </DrawerHeaderTitle>
        <MessageBar intent="info">
          <MessageBarBody>
            Canned answers computed from the sample dataset (all regions, 2023–2026). No live AI model is connected.
          </MessageBarBody>
        </MessageBar>
      </DrawerHeader>

      <DrawerBody>
        <div className="flex flex-col gap-4 pb-2">
          {messages.length === 0 && (
            <Body1 className="rounded-[var(--borderRadiusMedium)] border border-dashed border-[var(--colorNeutralStroke1)] p-4 text-[var(--colorNeutralForeground3)]">
              Ask about load factor, cancellations or which tours to keep. Pick a suggested question to see how an
              analytics agent would answer.
            </Body1>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-[var(--borderRadiusXLarge)] bg-[var(--colorBrandBackground)] px-3.5 py-2 text-[var(--colorNeutralForegroundOnBrand)]">
                  <Body1>{m.text}</Body1>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-2.5">
                <Avatar
                  size={28}
                  icon={<SparkleRegular />}
                  color="brand"
                  aria-hidden
                  className="shrink-0"
                />
                <div
                  className="flex min-w-0 flex-1 flex-col gap-3 rounded-[var(--borderRadiusXLarge)] bg-[var(--colorNeutralBackground1)] px-3.5 py-3 text-[14px] leading-5"
                  style={{ boxShadow: "var(--shadow4)" }}
                >
                  <div>{m.text}</div>
                  {m.visual}
                </div>
              </div>
            ),
          )}
          {thinking && <Spinner size="tiny" label="Analysing departures…" labelPosition="after" />}
          <div ref={endRef} />
        </div>
      </DrawerBody>

      <DrawerFooter className="flex-col items-stretch gap-3 border-t border-[var(--colorNeutralStroke2)]">
        {remaining.length > 0 && (
          <div className="flex w-full flex-wrap gap-1.5">
            {remaining.map((s) => (
              <Button key={s.q} size="small" shape="circular" disabled={thinking} onClick={() => ask(s.q)}>
                {s.q}
              </Button>
            ))}
          </div>
        )}
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <Input
            value={input}
            onChange={(_, d) => setInput(d.value)}
            placeholder="Ask a question about your tours…"
            aria-label="Ask a question"
            className="flex-1"
          />
          <Button type="submit" appearance="primary" icon={<SendRegular />} disabled={!input.trim() || thinking} aria-label="Send" />
        </form>
      </DrawerFooter>
    </OverlayDrawer>
  );
}

/* ------------------------------------------------------------------------- */
/* Canned answers. Text is templated, numbers come from the sample data.     */
/* ------------------------------------------------------------------------- */

function TourLink({ slug, children }: { slug: string; children: ReactNode }) {
  const { setAskOpen } = useFilters();
  return (
    <Link
      href={`/tours/${slug}`}
      onClick={() => setAskOpen(false)}
      className="font-semibold text-[var(--colorBrandForegroundLink)] no-underline hover:underline"
    >
      {children}
    </Link>
  );
}

function MiniTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)]">
      <Table size="small" aria-label="Answer details">
        <TableHeader className="bg-[var(--colorNeutralBackground2)]">
          <TableRow>
            {head.map((h, i) => (
              <TableHeaderCell key={h} style={i === 0 ? { width: "44%" } : undefined}>
                {h}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (
                <TableCell key={j} className="tabular">
                  {c}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function dropCandidates(): Answer {
  const list = summarizeTours(ALL_FILTERS)
    .filter((s) => s.status === "Retire candidate")
    .sort((a, b) => a.total.margin - b.total.margin);
  const loss = list.reduce((s, x) => s + x.total.margin, 0);
  const cancelCost = list.reduce((s, x) => s + x.total.cancellationCost, 0);
  return {
    text: (
      <>
        <p>
          <strong>{list.length} tours</strong> have been below break-even in at least three of the last four years. Together
          they have lost <strong>{fmtMoney(-loss)}</strong>, including {fmtMoney(cancelCost)} in cancellation and rebooking
          cost. They are the strongest candidates to drop from the 2028 programme.
        </p>
        <p className="mt-2 text-[var(--colorNeutralForeground3)]">
          Before cutting, check the seasonal ones: where spring departures fill and autumn ones do not, trimming
          autumn dates may recover the tour without dropping it.
        </p>
      </>
    ),
    visual: (
      <MiniTable
        head={["Tour", "Years below BE", "Avg LF", "Cum. margin"]}
        rows={list.map((s) => [
          <TourLink key={s.tour.id} slug={s.tour.slug}>
            {s.tour.name}
          </TourLink>,
          `${s.belowYears.length} of ${s.years.length}`,
          fmtPct(s.total.lf),
          <span key="m" className="text-[var(--colorStatusDangerForeground1)]">
            {fmtMoney(s.total.margin, { signed: true })}
          </span>,
        ])}
      />
    ),
  };
}

function regionAnswer(): Answer {
  const rows = regionConsistency();
  const best = rows.slice(0, 3);
  const worst = rows.at(-1)!;
  const data = rows.map((r) => ({ region: r.region, spread: r.spread * 100, lf: r.lf }));
  return {
    text: (
      <p>
        The most consistent regions year to year are <strong>{best.map((r) => r.region).join(", ")}</strong>, each
        moving less than {Math.ceil(best.at(-1)!.spread * 100)} points between years. <strong>{worst.region}</strong> is
        the least predictable, swinging about {Math.round(worst.spread * 100)} points between years
        {worst.region === "Rhine" || worst.region === "Danube"
          ? ", largely because of the 2026 low water season."
          : ", driven by tours that have been losing demand since 2024."}
      </p>
    ),
    visual: (
      <div>
        <div className="mb-1 text-xs text-[var(--colorNeutralForeground3)]">Year-to-year swing in load factor (std. dev., pts). Lower is steadier.</div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid {...GRID} horizontal={false} vertical />
              <XAxis type="number" {...AXIS} tickFormatter={(v) => `${v.toFixed(0)}`} />
              <YAxis type="category" dataKey="region" {...AXIS} axisLine={false} width={182} interval={0} />
              <Tooltip
                cursor={{ fill: "var(--colorNeutralBackground3)", opacity: 0.6 }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={payload[0].payload.region}
                      rows={[
                        { label: "Swing", value: `${(payload[0].payload.spread as number).toFixed(1)} pts`, swatch: "var(--series-1)" },
                        { label: "Avg load factor", value: fmtPct(payload[0].payload.lf as number, 1) },
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="spread" fill="var(--series-1)" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ),
  };
}

function cancellationAnswer(): Answer {
  const rows = cancellationsByYear();
  const y26 = rows.find((r) => r.year === "2026")!;
  const y25 = rows.find((r) => r.year === "2025")!;
  const total26 = y26.demand + y26.lowWater;
  const total25 = y25.demand + y25.lowWater;
  return {
    text: (
      <p>
        So far in 2026, <strong>{y26.count} departures</strong> have been cancelled at a cost of{" "}
        <strong>{fmtMoney(total26)}</strong> in supplier attrition fees and rebooking, {fmtChange(total26, total25)} on 2025.{" "}
        <strong>{fmtMoney(y26.lowWater)}</strong> of that came from low water on the Rhine and Danube, which no amount of
        demand would have prevented. The demand-driven share was {fmtMoney(y26.demand)},{" "}
        {fmtChange(y26.demand, y25.demand)} on 2025, mostly from tours already flagged as Retire candidate or Rework.
      </p>
    ),
    visual: (
      <div>
        <div className="mb-1 flex gap-4">
          <LegendItem color="var(--series-1)" label="Low demand" />
          <LegendItem color="var(--series-2)" label="Low water" />
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -4 }} barCategoryGap="30%">
              <CartesianGrid {...GRID} />
              <XAxis dataKey="year" {...AXIS} />
              <YAxis {...AXIS} axisLine={false} tickFormatter={(v) => fmtMoney(v)} width={56} />
              <Tooltip
                cursor={{ fill: "var(--colorNeutralBackground3)", opacity: 0.6 }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={`${label} · ${payload[0].payload.count} cancelled`}
                      rows={[
                        { label: "Low demand", value: fmtMoney(payload[0].payload.demand), swatch: "var(--series-1)" },
                        { label: "Low water", value: fmtMoney(payload[0].payload.lowWater), swatch: "var(--series-2)" },
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="demand" stackId="c" fill="var(--series-1)" stroke="var(--colorNeutralBackground1)" strokeWidth={1} isAnimationActive={false} />
              <Bar dataKey="lowWater" stackId="c" fill="var(--series-2)" stroke="var(--colorNeutralBackground1)" strokeWidth={1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ),
  };
}

function lowWaterAnswer(): Answer {
  const rows = riverQuarterly();
  const q2 = rows.find((r) => r.period === "2026 Q2");
  const q4 = rows.find((r) => r.period === "2026 Q4");
  const q3 = rows.find((r) => r.period === "2026 Q3");
  return {
    text: (
      <p>
        Rhine and Danube load factor fell from <strong>{fmtPct(q2?.rhineDanube ?? 0)}</strong> in Q2 2026 to{" "}
        <strong>{fmtPct(q3?.rhineDanube ?? 0)}</strong> in Q3 and <strong>{fmtPct(q4?.rhineDanube ?? 0)}</strong> on the
        books for Q4, while other rivers held steady. The dip is concentrated in August to November departures, which
        points to navigation, not demand. Treat these tours&apos; 2026 numbers with care before making product decisions.
      </p>
    ),
    visual: (
      <div>
        <div className="mb-1 flex gap-4">
          <LegendItem color="var(--series-1)" label="Rhine & Danube" kind="line" />
          <LegendItem color="var(--series-2)" label="Other rivers" kind="line" />
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="period" {...AXIS} tickFormatter={(v: string) => v.replace("20", "’")} />
              <YAxis {...AXIS} axisLine={false} domain={[0.3, 1]} tickFormatter={pctTick} width={48} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={label}
                      rows={[
                        { label: "Rhine & Danube", value: fmtPct(payload[0].payload.rhineDanube, 1), swatch: "var(--series-1)" },
                        ...(payload[0].payload.otherRivers != null
                          ? [{ label: "Other rivers", value: fmtPct(payload[0].payload.otherRivers, 1), swatch: "var(--series-2)" }]
                          : []),
                      ]}
                    />
                  ) : null
                }
              />
              <Line dataKey="rhineDanube" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 3.5, fill: "var(--series-1)", stroke: "var(--colorNeutralBackground1)", strokeWidth: 1.5 }} isAnimationActive={false} />
              <Line dataKey="otherRivers" stroke="var(--series-2)" strokeWidth={2} dot={{ r: 3.5, fill: "var(--series-2)", stroke: "var(--colorNeutralBackground1)", strokeWidth: 1.5 }} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    ),
  };
}

function upsideAnswer(): Answer {
  const rows = upsideTours();
  return {
    text: (
      <p>
        These tours sold at least 92% of capacity on many of their 2025–2026 departures. Demand is being turned away,
        so an extra departure in peak months is likely to clear break-even quickly. Start with{" "}
        <strong>{rows[0]?.s.tour.name}</strong>.
      </p>
    ),
    visual: (
      <MiniTable
        head={["Tour", "Near sold out", "Avg LF", "Status"]}
        rows={rows.map((r) => [
          <TourLink key={r.s.tour.id} slug={r.s.tour.slug}>
            {r.s.tour.name}
          </TourLink>,
          `${r.full} of ${r.of}`,
          fmtPct(r.s.total.lf),
          r.s.status,
        ])}
      />
    ),
  };
}
