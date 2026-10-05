import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersProvider } from "@/components/filters-provider";
import { AppHeader } from "@/components/app-header";
import { FilterBar } from "@/components/filter-bar";
import { AskPanel } from "@/components/ask-panel";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tour Portfolio Intelligence",
  description: "Load factor analytics mockup. All figures are generated sample data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-muted/40">
        <FiltersProvider>
          <TooltipProvider>
            <AppHeader />
            <FilterBar />
            <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">{children}</main>
            <footer className="border-t bg-card">
              <div className="mx-auto max-w-[1400px] px-4 py-3 text-xs text-muted-foreground md:px-6">
                Tour Portfolio Intelligence · Prospect demo. All tours, departures and figures are generated sample data,
                not real results.
              </div>
            </footer>
            <AskPanel />
          </TooltipProvider>
        </FiltersProvider>
      </body>
    </html>
  );
}
