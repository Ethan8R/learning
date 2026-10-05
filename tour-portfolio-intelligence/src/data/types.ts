/**
 * Data model for the Tour Load Factor Analytics mockup.
 *
 * A Tour is a product in the catalogue (e.g. "Rhine Castles & Vineyards").
 * Each Tour is sold as a series of Departures. A Departure bundles contracted
 * components (ship cabins or hotels + coaches) with a fixed capacity and a
 * break-even passenger count.
 *
 * In a real deployment these shapes would be populated from the reservation
 * system (bookings), the contracting system (capacity, contracted cost) and
 * finance (revenue, rebooking cost). See README "Plugging in real data".
 */

export type TourType = "River cruise" | "Escorted land tour";

export type Region =
  | "Rhine"
  | "Danube"
  | "French Rivers"
  | "Douro"
  | "Western Europe"
  | "Central Europe"
  | "Mediterranean"
  | "British Isles"
  | "Scandinavia"
  | "North America Fall Foliage";

export type DepartureStatus = "operated" | "cancelled" | "upcoming";

export type CancellationReason = "Below break-even" | "Low water levels";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export interface Tour {
  id: string;
  slug: string;
  name: string;
  region: Region;
  type: TourType;
  durationDays: number;
  /** First season the tour was on sale. Most tours run 2023 to 2026. */
  firstYear: number;
  /** Average price per passenger in USD. */
  pricePerPax: number;
}

export interface Departure {
  id: string;
  tourId: string;
  tourName: string;
  region: Region;
  type: TourType;
  /** ISO date, yyyy-mm-dd */
  date: string;
  year: number;
  season: Season;
  /** Contracted seats/cabin berths for this departure. */
  capacity: number;
  /** Passengers needed to cover contracted cost. */
  breakEvenPax: number;
  /**
   * Passengers booked. For cancelled departures this is the booking count at
   * the time of cancellation. For upcoming departures it is current bookings.
   */
  bookedPax: number;
  /** Gross revenue in USD. Zero for cancelled departures (refunded or moved). */
  revenue: number;
  /**
   * Contracted cost in USD. For operated or upcoming departures this is the
   * full cost of the contracted components. For cancelled departures it is the
   * attrition and release fees actually paid to suppliers.
   */
  contractedCost: number;
  status: DepartureStatus;
  /** Cost of moving passengers to other dates (compensation, fare deltas). */
  rebookingCost: number;
  cancellationReason?: CancellationReason;
}
