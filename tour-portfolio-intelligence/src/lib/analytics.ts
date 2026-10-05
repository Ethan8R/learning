/**
 * Pure aggregation functions over departures. No React here, so the same
 * logic can later run server-side against a real warehouse extract.
 *
 * Definitions used throughout:
 * - Load factor (LF) = booked pax / capacity.
 * - Break-even load factor = break-even pax / capacity.
 * - A tour-year is "below break-even" when total booked pax < total break-even
 *   pax across that year's departures (equivalently LF < break-even LF).
 * - Cancelled departures count at the bookings held when they were cancelled,
 *   so cancelling a weak date does not flatter the load factor.
 * - Margin = revenue - contracted cost - rebooking cost.
 */
import { DEPARTURES, TOURS, YEARS, type Year } from "@/data/seed";
import type { Departure, Region, Season, Tour, TourType } from "@/data/types";

export interface Filters {
  yearFrom: Year;
  yearTo: Year;
  region: Region | "All";
  type: TourType | "All";
}

export const DEFAULT_FILTERS: Filters = { yearFrom: 2023, yearTo: 2026, region: "All", type: "All" };

export const yearsInRange = (f: Pick<Filters, "yearFrom" | "yearTo">) =>
  YEARS.filter((y) => y >= f.yearFrom && y <= f.yearTo);

export const tourMatches = (t: Pick<Tour, "region" | "type">, f: Filters) =>
  (f.region === "All" || t.region === f.region) && (f.type === "All" || t.type === f.type);

export const filterTours = (f: Filters) => TOURS.filter((t) => tourMatches(t, f));

export const filterDepartures = (f: Filters, opts: { ignoreYears?: boolean } = {}) =>
  DEPARTURES.filter(
    (d) => tourMatches(d, f) && (opts.ignoreYears || (d.year >= f.yearFrom && d.year <= f.yearTo)),
  );

export const departureMargin = (d: Departure) => d.revenue - d.contractedCost - d.rebookingCost;
export const departureLf = (d: Departure) => d.bookedPax / d.capacity;
export const departureAbove = (d: Departure) => d.status !== "cancelled" && d.bookedPax >= d.breakEvenPax;

export interface Agg {
  departures: number;
  operated: number;
  cancelled: number;
  upcoming: number;
  lowWaterCancelled: number;
  capacity: number;
  breakEven: number;
  booked: number;
  lf: number;
  beLf: number;
  aboveCount: number;
  pctAbove: number;
  revenue: number;
  margin: number;
  /** Attrition fees plus rebooking cost on cancelled departures. */
  cancellationCost: number;
}

export function aggregate(deps: Departure[]): Agg {
  const a: Agg = {
    departures: deps.length,
    operated: 0,
    cancelled: 0,
    upcoming: 0,
    lowWaterCancelled: 0,
    capacity: 0,
    breakEven: 0,
    booked: 0,
    lf: 0,
    beLf: 0,
    aboveCount: 0,
    pctAbove: 0,
    revenue: 0,
    margin: 0,
    cancellationCost: 0,
  };
  for (const d of deps) {
    a[d.status]++;
    if (d.cancellationReason === "Low water levels") a.lowWaterCancelled++;
    a.capacity += d.capacity;
    a.breakEven += d.breakEvenPax;
    a.booked += d.bookedPax;
    a.revenue += d.revenue;
    a.margin += departureMargin(d);
    if (departureAbove(d)) a.aboveCount++;
    if (d.status === "cancelled") a.cancellationCost += d.contractedCost + d.rebookingCost;
  }
  a.lf = a.capacity ? a.booked / a.capacity : 0;
  a.beLf = a.capacity ? a.breakEven / a.capacity : 0;
  a.pctAbove = a.departures ? a.aboveCount / a.departures : 0;
  return a;
}

export const groupBy = <T, K extends string | number>(items: T[], key: (t: T) => K) => {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
};

/** Heatmap band for a load factor against its break-even load factor. */
export type Band = "below" | "near" | "above";
export const NEAR_BAND_PTS = 0.05;
export const bandOf = (lf: number, beLf: number): Band =>
  lf < beLf ? "below" : lf - beLf < NEAR_BAND_PTS ? "near" : "above";

export type TourStatus = "Keep" | "Watch" | "Rework" | "Retire candidate";
export type Trend = "up" | "down" | "flat";

export interface TourSummary {
  tour: Tour;
  years: Year[];
  byYear: Partial<Record<Year, Agg>>;
  total: Agg;
  /** Change in load factor per year (fraction, e.g. 0.05 = +5 pts/yr). */
  slope: number;
  trend: Trend;
  belowYears: Year[];
  longestBelowStreak: number;
  aboveEveryYear: boolean;
  status: TourStatus;
  statusReason: string;
}

function linearSlope(points: [number, number][]) {
  if (points.length < 2) return 0;
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  let num = 0;
  let den = 0;
  for (const [x, y] of points) {
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  }
  return den ? num / den : 0;
}

export function summarizeTour(tour: Tour, deps: Departure[], years: Year[]): TourSummary {
  const tourDeps = deps.filter((d) => d.tourId === tour.id);
  const byYear: Partial<Record<Year, Agg>> = {};
  for (const y of years) {
    const yd = tourDeps.filter((d) => d.year === y);
    if (yd.length) byYear[y] = aggregate(yd);
  }
  const activeYears = years.filter((y) => byYear[y]);
  const belowYears = activeYears.filter((y) => byYear[y]!.lf < byYear[y]!.beLf);

  let longest = 0;
  let run = 0;
  for (const y of activeYears) {
    run = belowYears.includes(y) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  const slope = linearSlope(activeYears.map((y) => [y, byYear[y]!.lf]));
  const trend: Trend = slope > 0.02 ? "up" : slope < -0.02 ? "down" : "flat";
  const latest = activeYears.at(-1);
  const latestAgg = latest ? byYear[latest] : undefined;
  const latestBand = latestAgg ? bandOf(latestAgg.lf, latestAgg.beLf) : "above";

  const latestHeadroom = latestAgg ? latestAgg.lf - latestAgg.beLf : 0;

  let status: TourStatus = "Keep";
  let statusReason = "Above break-even every year with a stable or rising load factor.";
  if (longest >= 3 || belowYears.length >= 3) {
    status = "Retire candidate";
    statusReason = `Below break-even in ${belowYears.length} of ${activeYears.length} years.`;
  } else if (belowYears.length >= 2) {
    status = "Rework";
    statusReason = `Below break-even in ${belowYears.length} of ${activeYears.length} years.`;
  } else if (latestBand === "below") {
    status = "Watch";
    statusReason = `Fell below break-even in ${latest}.`;
  } else if (latestBand === "near") {
    status = "Watch";
    statusReason = `Within ${NEAR_BAND_PTS * 100} pts of break-even in ${latest}.`;
  } else if (trend === "down" && latestHeadroom < 0.1) {
    status = "Watch";
    statusReason = "Load factor is declining and headroom over break-even is thin.";
  } else if (belowYears.length === 1 && trend !== "up") {
    status = "Watch";
    statusReason = `Dipped below break-even in ${belowYears[0]}.`;
  } else if (belowYears.length === 1) {
    statusReason = `Recovered from ${belowYears[0]}; load factor rising every year since.`;
  } else if (trend === "down") {
    statusReason = "Still well above break-even, though load factor eased in the latest year.";
  }

  return {
    tour,
    years: activeYears,
    byYear,
    total: aggregate(tourDeps),
    slope,
    trend,
    belowYears,
    longestBelowStreak: longest,
    aboveEveryYear: activeYears.length > 0 && belowYears.length === 0,
    status,
    statusReason,
  };
}

export function summarizeTours(f: Filters) {
  const deps = filterDepartures(f);
  const years = yearsInRange(f);
  return filterTours(f)
    .map((t) => summarizeTour(t, deps, years))
    .filter((s) => s.years.length > 0);
}

/** Tours below break-even for at least `minYears` consecutive years, worst loss first. */
export const needsAttention = (summaries: TourSummary[], minYears = 2) =>
  summaries.filter((s) => s.longestBelowStreak >= minYears).sort((a, b) => a.total.margin - b.total.margin);

export const reliablePerformers = (summaries: TourSummary[]) =>
  summaries
    .filter((s) => s.aboveEveryYear && s.years.length >= 2 && s.status === "Keep")
    .sort((a, b) => b.total.lf - a.total.lf);

/** Load factor time series for the overview chart. */
export function lfSeries(f: Filters, granularity: "year" | "quarter", split: "none" | "type") {
  const deps = filterDepartures(f);
  const keyOf = (d: Departure) =>
    granularity === "year" ? String(d.year) : `${d.year} Q${Math.floor((Number(d.date.slice(5, 7)) - 1) / 3) + 1}`;
  const buckets = groupBy(deps, keyOf);
  const keys = [...buckets.keys()].sort();
  return keys.map((k) => {
    const b = buckets.get(k)!;
    const all = aggregate(b);
    const row: Record<string, number | string | null> = { period: k, lf: all.lf, beLf: all.beLf, departures: all.departures };
    if (split === "type") {
      const river = b.filter((d) => d.type === "River cruise");
      const land = b.filter((d) => d.type === "Escorted land tour");
      row.river = river.length ? aggregate(river).lf : null;
      row.land = land.length ? aggregate(land).lf : null;
    }
    return row;
  });
}

/* ------------------------------------------------------------------------- */
/* Tour detail insight                                                        */
/* ------------------------------------------------------------------------- */

const pct = (n: number) => `${Math.round(n * 100)}%`;
const money = (n: number) => {
  const a = Math.abs(n);
  return (n < 0 ? "−" : "") + (a >= 1_000_000 ? `$${(a / 1_000_000).toFixed(1)}M` : `$${Math.round(a / 1000)}K`);
};

export interface Insight {
  headline: string;
  points: string[];
  recommendation: string;
}

export function tourInsight(s: TourSummary, deps: Departure[]): Insight {
  const points: string[] = [];
  const n = s.years.length;
  const first = s.years[0];
  const last = s.years.at(-1)!;

  const headline =
    s.belowYears.length === 0
      ? `Above break-even in all ${n} year${n > 1 ? "s" : ""}, averaging ${pct(s.total.lf)} load factor against a ${pct(s.total.beLf)} break-even.`
      : `Below break-even in ${s.belowYears.length} of ${n} years (${s.belowYears.join(", ")}).`;

  if (n >= 2 && s.trend !== "flat") {
    points.push(
      `Load factor has ${s.trend === "up" ? "risen" : "fallen"} from ${pct(s.byYear[first]!.lf)} in ${first} to ${pct(s.byYear[last]!.lf)} in ${last}.`,
    );
  }

  const bySeason = groupBy(deps, (d) => d.season);
  const seasonLf = (k: Season) => {
    const g = bySeason.get(k);
    return g && g.length >= 2 ? aggregate(g) : undefined;
  };
  const spring = seasonLf("Spring");
  const autumn = seasonLf("Autumn");
  let seasonalSplit = false;
  if (spring && autumn && Math.abs(spring.lf - autumn.lf) >= 0.12) {
    seasonalSplit = true;
    const [hi, lo, hiName, loName] =
      spring.lf > autumn.lf ? [spring, autumn, "Spring", "autumn"] : [autumn, spring, "Autumn", "spring"];
    points.push(
      `${hiName} departures fill (${pct(hi.lf)} load factor), ${loName} departures do not (${pct(lo.lf)}, against ${pct(lo.beLf)} break-even).`,
    );
  }

  if (s.total.cancelled > 0) {
    points.push(
      `${s.total.cancelled} departure${s.total.cancelled > 1 ? "s" : ""} cancelled, costing ${money(s.total.cancellationCost)} in supplier attrition and rebooking.`,
    );
  }
  if (s.total.lowWaterCancelled > 0) {
    points.push(
      `${s.total.lowWaterCancelled} of those were low water cancellations in 2026: a navigation problem, not a demand problem.`,
    );
  }
  const soldOut = deps.filter((d) => d.status !== "cancelled" && d.bookedPax / d.capacity >= 0.92).length;
  if (soldOut >= 3) points.push(`${soldOut} departures sold above 92% of capacity.`);

  let recommendation: string;
  switch (s.status) {
    case "Retire candidate":
      recommendation = seasonalSplit
        ? "Drop the weak season entirely, or retire the tour from the 2028 programme if a reduced schedule cannot clear break-even."
        : `Retire from the 2028 programme. Cumulative margin is ${money(s.total.margin)}; a relaunch would need a smaller contracted capacity to make sense.`;
      break;
    case "Rework":
      recommendation = seasonalSplit
        ? "Consider cutting the weak-season dates and concentrating capacity where demand is."
        : "Reduce the number of departures and renegotiate contracted capacity before the next contracting round.";
      break;
    case "Watch":
      recommendation = "Hold departures flat and review again after the next booking window closes.";
      break;
    default:
      recommendation =
        soldOut >= 3
          ? "Strong and consistent. Test one or two additional departures in peak months."
          : "Keep as is. No action needed.";
  }
  return { headline, points, recommendation };
}

/* ------------------------------------------------------------------------- */
/* "Ask the data" canned answers, computed from the full sample dataset      */
/* ------------------------------------------------------------------------- */

export const ALL_FILTERS = DEFAULT_FILTERS;

export function regionConsistency() {
  const rows = [...groupBy(DEPARTURES, (d) => d.region).entries()].map(([region, deps]) => {
    const yearly = YEARS.map((y) => deps.filter((d) => d.year === y)).filter((g) => g.length).map((g) => aggregate(g).lf);
    const mean = yearly.reduce((s, v) => s + v, 0) / yearly.length;
    const sd = Math.sqrt(yearly.reduce((s, v) => s + (v - mean) ** 2, 0) / yearly.length);
    return { region, lf: aggregate(deps).lf, spread: sd };
  });
  return rows.sort((a, b) => a.spread - b.spread);
}

export function cancellationsByYear() {
  return YEARS.map((y) => {
    const deps = DEPARTURES.filter((d) => d.year === y && d.status === "cancelled");
    const lowWater = deps.filter((d) => d.cancellationReason === "Low water levels");
    const demand = deps.filter((d) => d.cancellationReason === "Below break-even");
    const cost = (g: Departure[]) => g.reduce((s, d) => s + d.contractedCost + d.rebookingCost, 0);
    return { year: String(y), demand: cost(demand), lowWater: cost(lowWater), count: deps.length };
  });
}

export function riverQuarterly() {
  const deps = DEPARTURES.filter((d) => (d.region === "Rhine" || d.region === "Danube") && d.year >= 2025);
  const others = DEPARTURES.filter((d) => d.type === "River cruise" && d.region !== "Rhine" && d.region !== "Danube" && d.year >= 2025);
  const q = (d: Departure) => `${d.year} Q${Math.floor((Number(d.date.slice(5, 7)) - 1) / 3) + 1}`;
  const a = groupBy(deps, q);
  const b = groupBy(others, q);
  return [...a.keys()].sort().map((k) => ({
    period: k,
    rhineDanube: aggregate(a.get(k)!).lf,
    otherRivers: b.get(k) ? aggregate(b.get(k)!).lf : null,
  }));
}

export function upsideTours() {
  const deps = DEPARTURES.filter((d) => d.year >= 2025);
  return summarizeTours({ ...ALL_FILTERS, yearFrom: 2025 })
    .map((s) => {
      const td = deps.filter((d) => d.tourId === s.tour.id && d.status !== "cancelled");
      const full = td.filter((d) => d.bookedPax / d.capacity >= 0.92).length;
      return { s, full, of: td.length };
    })
    .filter((r) => r.full >= 3)
    .sort((a, b) => b.full / b.of - a.full / a.of)
    .slice(0, 6);
}
