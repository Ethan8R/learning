"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FlaskConical, MessageSquareText, Table2 } from "lucide-react";
import { useFilters } from "@/components/filters-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/tours", label: "Tour comparison", icon: Table2 },
];

/** Generic mark: a ring with a river line through it. Not a real brand. */
function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--brass)" strokeWidth="1.5" />
      <path d="M5 19c3.5-3 6.5-3 10 0s6.5 3 12 0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="16" cy="9.5" r="1.6" fill="var(--brass)" />
    </svg>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { setAskOpen } = useFilters();
  return (
    <header className="bg-ink text-[#f6f1e4]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-3 px-4 pt-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-md" aria-label="Tour Portfolio Intelligence, overview">
          <Mark />
          <span className="leading-none">
            <span className="font-display block text-[1.4rem]">
              Tour Portfolio <em className="text-[#e3b261]">Intelligence</em>
            </span>
            <span className="mt-1 block font-mono text-[0.625rem] tracking-[0.14em] text-[#f6f1e4]/60 uppercase">
              Load factor analytics
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e3b261]/60 px-3 font-mono text-[0.6875rem] tracking-[0.08em] text-[#f0c77f] uppercase"
            title="All figures are generated mock data for demonstration only."
          >
            <FlaskConical className="size-3.5" aria-hidden />
            Sample data
          </span>
          <button
            type="button"
            onClick={() => setAskOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#e3b261] px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-[#f0c77f]"
          >
            <MessageSquareText className="size-4" aria-hidden />
            Ask the data
          </button>
        </div>

        <nav className="flex w-full gap-6 border-t border-white/10" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px flex min-h-11 items-center gap-2 text-sm font-medium transition-colors duration-200",
                  active ? "text-[#f6f1e4]" : "text-[#f6f1e4]/60 hover:text-[#f6f1e4]",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#e3b261] transition-transform duration-200 origin-left",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
