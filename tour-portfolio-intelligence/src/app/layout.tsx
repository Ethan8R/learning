import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Schibsted_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersProvider } from "@/components/filters-provider";
import { AppHeader } from "@/components/app-header";
import { FilterBar } from "@/components/filter-bar";
import { AskPanel } from "@/components/ask-panel";
import "./globals.css";

/* Display: editorial serif for headlines and hero figures.
   Body: a characterful grotesk for UI text.
   Ledger: mono for labels, column heads and figures that must align. */
const display = Instrument_Serif({ variable: "--font-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = Schibsted_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const ledger = IBM_Plex_Mono({ variable: "--font-ledger", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Tour Portfolio Intelligence",
  description: "Load factor analytics mockup. All figures are generated sample data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${ledger.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded bg-ink px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <FiltersProvider>
          <TooltipProvider>
            <AppHeader />
            <FilterBar />
            <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-8 pb-12 md:px-8">
              {children}
            </main>
            <footer className="border-t border-rule">
              <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-4 md:px-8">
                <span className="eyebrow">Tour Portfolio Intelligence · Prospect demo</span>
                <span className="text-xs text-muted-foreground">
                  All tours, departures and figures are generated sample data, not real results.
                </span>
              </div>
            </footer>
            <AskPanel />
          </TooltipProvider>
        </FiltersProvider>
      </body>
    </html>
  );
}
