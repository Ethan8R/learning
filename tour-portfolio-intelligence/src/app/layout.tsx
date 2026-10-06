import type { Metadata } from "next";
import { Providers } from "./providers";
import { AppHeader } from "@/components/app-header";
import { FilterBar } from "@/components/filter-bar";
import { AskPanel } from "@/components/ask-panel";
import { AppFooter } from "@/components/app-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tour Portfolio Intelligence",
  description: "Load factor analytics mockup. All figures are generated sample data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <AppHeader />
          <FilterBar />
          <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 pb-10 md:px-8">
            {children}
          </main>
          <AppFooter />
          <AskPanel />
        </Providers>
      </body>
    </html>
  );
}
