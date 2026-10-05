"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, FlaskConical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/components/filters-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Portfolio overview" },
  { href: "/tours", label: "Tour comparison" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { setAskOpen } = useFilters();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-4.5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">Tour Portfolio Intelligence</span>
            <span className="block text-xs text-muted-foreground">Load factor analytics</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full gap-1 md:order-none md:w-auto" aria-label="Main">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
            title="All figures are generated mock data for demonstration only."
          >
            <FlaskConical className="size-3.5" aria-hidden />
            Sample data
          </span>
          <Button size="sm" onClick={() => setAskOpen(true)}>
            <Sparkles aria-hidden />
            Ask the data
          </Button>
        </div>
      </div>
    </header>
  );
}
