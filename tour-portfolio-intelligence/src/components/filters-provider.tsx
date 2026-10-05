"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_FILTERS, type Filters } from "@/lib/analytics";

const STORAGE_KEY = "tpi.filters.v1";

interface FiltersContextValue {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  reset: () => void;
  askOpen: boolean;
  setAskOpen: (open: boolean) => void;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

/**
 * Global filters live in the root layout so they survive navigation between
 * screens, and are mirrored to localStorage so a page refresh keeps them too.
 */
export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setState] = useState<Filters>(DEFAULT_FILTERS);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (raw) setState({ ...DEFAULT_FILTERS, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: keep defaults */
    }
  }, []);

  const setFilters = useCallback((patch: Partial<Filters>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (next.yearFrom > next.yearTo) {
        if (patch.yearFrom !== undefined) next.yearTo = next.yearFrom;
        else next.yearFrom = next.yearTo;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), [setFilters]);

  const value = useMemo(
    () => ({ filters, setFilters, reset, askOpen, setAskOpen }),
    [filters, setFilters, reset, askOpen],
  );
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}
