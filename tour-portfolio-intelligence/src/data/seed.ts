/**
 * Seeded mock data for the demo. Nothing here is real.
 *
 * Every number is produced by a deterministic generator with a fixed seed, so
 * the dashboard shows exactly the same figures on every run and every machine.
 * Each tour has a hidden "profile" that shapes its demand so the dashboard has
 * a story to tell (consistent winners, chronic losers, risers, fallers, a
 * seasonal split, and a low water dip on the Rhine and Danube in late 2026).
 */
import { between, hashString, intBetween, mulberry32, pick, type Rng } from "./rng";
import type { CancellationReason, Departure, DepartureStatus, Region, Season, Tour, TourType } from "./types";

export const SEED = 20230101;
/** The "today" of the demo. Departures after this date are upcoming. */
export const AS_OF = "2026-10-05";
export const YEARS = [2023, 2024, 2025, 2026] as const;
export type Year = (typeof YEARS)[number];

export const REGIONS: Region[] = [
  "Rhine",
  "Danube",
  "French Rivers",
  "Douro",
  "Western Europe",
  "Central Europe",
  "Mediterranean",
  "British Isles",
  "Scandinavia",
  "North America Fall Foliage",
];
export const TOUR_TYPES: TourType[] = ["River cruise", "Escorted land tour"];

type Profile = "strong" | "chronic" | "rising" | "falling" | "seasonal" | "steady";

interface TourSeed {
  name: string;
  region: Region;
  type: TourType;
  profile: Profile;
  firstYear?: number;
}

const R = "River cruise" as const;
const L = "Escorted land tour" as const;

const TOUR_SEEDS: TourSeed[] = [
  // Consistently strong
  { name: "Rhine Castles & Vineyards", region: "Rhine", type: R, profile: "strong" },
  { name: "Blue Danube Classic", region: "Danube", type: R, profile: "strong" },
  { name: "Paris to Normandy on the Seine", region: "French Rivers", type: R, profile: "strong" },
  { name: "Douro Valley Wine Route", region: "Douro", type: R, profile: "strong" },
  { name: "Swiss Alps & Lakes", region: "Central Europe", type: L, profile: "strong" },
  { name: "Vermont & New Hampshire Foliage", region: "North America Fall Foliage", type: L, profile: "strong" },

  // Missed break-even three years running (plus one seasonal tour below)
  { name: "Danube Delta Explorer", region: "Danube", type: R, profile: "chronic" },
  { name: "Lower Rhône & Camargue", region: "French Rivers", type: R, profile: "chronic" },
  { name: "Scottish Islands & Lochs", region: "British Isles", type: L, profile: "chronic" },
  { name: "Atlantic Canada Foliage Circuit", region: "North America Fall Foliage", type: L, profile: "chronic" },

  // Trending up
  { name: "Portugal Coast to the Douro", region: "Douro", type: R, profile: "rising" },
  { name: "Norwegian Fjords & Rail", region: "Scandinavia", type: L, profile: "rising" },
  { name: "Ireland's Wild Atlantic Way", region: "British Isles", type: L, profile: "rising" },
  { name: "Amalfi Coast & Sicily", region: "Mediterranean", type: L, profile: "rising", firstYear: 2024 },

  // Trending down
  { name: "Grand Tour of Germany", region: "Central Europe", type: L, profile: "falling" },
  { name: "Benelux & Rhine Valley", region: "Western Europe", type: L, profile: "falling" },
  { name: "Danube Christmas Markets", region: "Danube", type: R, profile: "falling" },
  { name: "Greek Isles Island Hopper", region: "Mediterranean", type: L, profile: "falling" },
  { name: "Baltic Capitals by Coach", region: "Scandinavia", type: L, profile: "falling" },

  // Spring fills, autumn does not
  { name: "Loire Châteaux & Burgundy", region: "Western Europe", type: L, profile: "seasonal" },
  { name: "Lower Danube to the Black Sea", region: "Danube", type: R, profile: "seasonal" },
  { name: "Rhine & Moselle Explorer", region: "Rhine", type: R, profile: "seasonal" },

  // Steady middle of the portfolio
  { name: "Rhine Getaway", region: "Rhine", type: R, profile: "steady" },
  { name: "Danube Waltz", region: "Danube", type: R, profile: "steady" },
  { name: "Budapest to Vienna Short Break", region: "Danube", type: R, profile: "steady" },
  { name: "Bordeaux Wine Rivers", region: "French Rivers", type: R, profile: "steady" },
  { name: "Douro Port & Pousadas", region: "Douro", type: R, profile: "steady" },
  { name: "Best of England", region: "British Isles", type: L, profile: "steady" },
  { name: "Wales & Cornwall", region: "British Isles", type: L, profile: "steady" },
  { name: "Spain & Portugal Highlights", region: "Mediterranean", type: L, profile: "steady" },
  { name: "Croatian Coast & Islands", region: "Mediterranean", type: L, profile: "steady", firstYear: 2025 },
  { name: "Vienna, Prague & Budapest", region: "Central Europe", type: L, profile: "steady" },
  { name: "Bavaria & Austrian Tyrol", region: "Central Europe", type: L, profile: "steady" },
  { name: "Poland & Kraków Heritage", region: "Central Europe", type: L, profile: "steady" },
  { name: "Scandinavian Capitals", region: "Scandinavia", type: L, profile: "steady" },
  { name: "Iceland Ring Road", region: "Scandinavia", type: L, profile: "steady" },
  { name: "Paris & Provence", region: "Western Europe", type: L, profile: "steady" },
  { name: "Holland & Belgium in Bloom", region: "Western Europe", type: L, profile: "steady" },
  { name: "Canadian Maritimes Foliage", region: "North America Fall Foliage", type: L, profile: "steady" },
  { name: "Blue Ridge Parkway Autumn", region: "North America Fall Foliage", type: L, profile: "steady" },
];

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Target ratio of booked pax to break-even pax for each year, by profile. */
function yearRatios(profile: Profile, rng: Rng): Record<Year, number> {
  const j = () => between(rng, -0.04, 0.04);
  switch (profile) {
    case "strong": {
      const base = between(rng, 1.3, 1.42);
      return { 2023: base + j(), 2024: base + j(), 2025: base + j(), 2026: base + j() };
    }
    case "chronic": {
      const base = between(rng, 0.8, 0.88);
      return { 2023: base + j(), 2024: base + j() - 0.02, 2025: base + j() - 0.03, 2026: base + j() - 0.04 };
    }
    case "rising":
      return { 2023: 0.9 + j(), 2024: 1.02 + j(), 2025: 1.15 + j(), 2026: 1.27 + j() };
    case "falling":
      return { 2023: 1.27 + j(), 2024: 1.14 + j(), 2025: 0.95 + j(), 2026: 0.86 + j() };
    case "seasonal": {
      const base = between(rng, 0.98, 1.03);
      return { 2023: base + j(), 2024: base + j(), 2025: base + j(), 2026: base + j() };
    }
    case "steady": {
      const base = between(rng, 1.06, 1.24);
      const k = () => between(rng, -0.08, 0.08);
      return { 2023: base + k(), 2024: base + k(), 2025: base + k(), 2026: base + k() };
    }
  }
}

function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Autumn";
  return "Winter";
}

/** Months a tour can depart in, by region and type. */
function departureMonths(seed: TourSeed): number[] {
  if (seed.region === "North America Fall Foliage") return [9, 10];
  if (seed.name.includes("Christmas")) return [11, 12];
  if (seed.type === "River cruise") return [3, 4, 5, 6, 7, 8, 9, 10, 11];
  return [4, 5, 6, 7, 8, 9, 10];
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function buildTour(seed: TourSeed, index: number) {
  const rng = mulberry32(SEED ^ hashString(seed.name));
  const isRiver = seed.type === "River cruise";
  const capacity = isRiver ? pick(rng, [130, 150, 164, 176, 190]) : pick(rng, [36, 40, 44, 48]);
  const breakEvenShare = between(rng, 0.6, 0.7);
  const pricePerPax = Math.round((isRiver ? between(rng, 3800, 6200) : between(rng, 2900, 5200)) / 10) * 10;
  const tour: Tour = {
    id: `T${String(index + 1).padStart(3, "0")}`,
    slug: slugify(seed.name),
    name: seed.name,
    region: seed.region,
    type: seed.type,
    durationDays: isRiver ? pick(rng, [8, 10, 12, 15]) : pick(rng, [9, 11, 13, 16]),
    firstYear: seed.firstYear ?? 2023,
    pricePerPax,
  };

  const ratios = yearRatios(seed.profile, rng);
  const months = departureMonths(seed);
  const isFoliage = seed.region === "North America Fall Foliage";
  const baseCount = isFoliage ? intBetween(rng, 4, 6) : isRiver ? intBetween(rng, 8, 12) : intBetween(rng, 5, 10);
  const departures: Departure[] = [];

  for (const year of YEARS) {
    if (year < tour.firstYear) continue;
    const count = Math.max(4, Math.min(12, baseCount + intBetween(rng, -1, 1)));
    for (let i = 0; i < count; i++) {
      // Spread departures evenly through the season window.
      const pos = (i + 0.5) / count;
      const month = months[Math.min(months.length - 1, Math.floor(pos * months.length))];
      const day = intBetween(rng, 2, 27);
      const date = iso(year, month, day);
      const season = seasonOf(month);

      let ratio = ratios[year] * between(rng, 0.88, 1.12);
      if (seed.profile === "seasonal") ratio *= season === "Spring" ? 1.2 : season === "Autumn" ? 0.78 : 1.0;

      // Low water on the Rhine and Danube from August to November 2026.
      const lowWaterWindow =
        (seed.region === "Rhine" || seed.region === "Danube") && year === 2026 && month >= 8 && month <= 11;
      if (lowWaterWindow) ratio *= 0.7;

      const capacityPax = capacity;
      const breakEvenPax = Math.round(capacityPax * breakEvenShare);
      let bookedPax = Math.max(6, Math.min(capacityPax, Math.round(breakEvenPax * ratio)));

      let status: DepartureStatus;
      let cancellationReason: CancellationReason | undefined;
      if (date > AS_OF) {
        status = "upcoming";
        bookedPax = Math.round(bookedPax * between(rng, 0.88, 0.97));
      } else if (lowWaterWindow && rng() < 0.45) {
        status = "cancelled";
        cancellationReason = "Low water levels";
      } else {
        const shortfall = bookedPax / breakEvenPax;
        const cancelChance = shortfall < 0.8 ? 0.75 : shortfall < 0.9 ? 0.3 : 0;
        if (rng() < cancelChance) {
          status = "cancelled";
          cancellationReason = "Below break-even";
        } else {
          status = "operated";
        }
      }

      const fixedCost = breakEvenPax * pricePerPax * 0.8;
      let revenue = 0;
      let contractedCost = 0;
      let rebookingCost = 0;
      if (status === "cancelled") {
        contractedCost = fixedCost * between(rng, 0.18, 0.26);
        const perPax =
          cancellationReason === "Low water levels" ? pricePerPax * 0.14 + 250 : pricePerPax * 0.1 + 180;
        rebookingCost = bookedPax * perPax;
      } else {
        revenue = bookedPax * pricePerPax * between(rng, 0.95, 1.04);
        contractedCost = fixedCost + bookedPax * pricePerPax * 0.2;
      }

      departures.push({
        id: `${tour.id}-${year}-${String(i + 1).padStart(2, "0")}`,
        tourId: tour.id,
        tourName: tour.name,
        region: tour.region,
        type: tour.type,
        date,
        year,
        season,
        capacity: capacityPax,
        breakEvenPax,
        bookedPax,
        revenue: Math.round(revenue),
        contractedCost: Math.round(contractedCost),
        status,
        rebookingCost: Math.round(rebookingCost),
        cancellationReason,
      });
    }
  }
  departures.sort((a, b) => a.date.localeCompare(b.date));
  return { tour, departures };
}

const built = TOUR_SEEDS.map(buildTour);

export const TOURS: Tour[] = built.map((b) => b.tour);
export const DEPARTURES: Departure[] = built.flatMap((b) => b.departures);
export const TOUR_BY_SLUG = new Map(TOURS.map((t) => [t.slug, t]));
