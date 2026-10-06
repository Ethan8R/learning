"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Button, Subtitle2, Caption1, Tab, TabList, Tooltip } from "@fluentui/react-components";
import {
  BeakerRegular,
  DataTrendingRegular,
  GlobeLocationRegular,
  SparkleRegular,
  TableRegular,
} from "@fluentui/react-icons";
import { useFilters } from "@/components/filters-provider";

const NAV = [
  { value: "/", label: "Portfolio overview", icon: <DataTrendingRegular /> },
  { value: "/tours", label: "Tour comparison", icon: <TableRegular /> },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { setAskOpen } = useFilters();
  const selected = pathname.startsWith("/tours") ? "/tours" : "/";

  return (
    <header className="bg-[var(--colorNeutralBackground1)] shadow-[var(--shadow4)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-3 md:px-8">
        <Link href="/" className="flex items-center gap-3 no-underline" aria-label="Tour Portfolio Intelligence, overview">
          <span className="grid size-9 place-items-center rounded-[var(--borderRadiusLarge)] bg-[var(--colorBrandBackground)] text-[var(--colorNeutralForegroundOnBrand)]">
            <GlobeLocationRegular fontSize={22} aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <Subtitle2 className="text-[var(--colorNeutralForeground1)]">Tour Portfolio Intelligence</Subtitle2>
            <Caption1 className="text-[var(--colorNeutralForeground3)]">Load factor analytics</Caption1>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip content="All figures are generated mock data for demonstration only." relationship="description">
            <Badge appearance="tint" color="warning" size="large" icon={<BeakerRegular />}>
              Sample data
            </Badge>
          </Tooltip>
          <Button appearance="primary" icon={<SparkleRegular />} onClick={() => setAskOpen(true)}>
            Ask the data
          </Button>
        </div>

        <nav className="-mx-2 w-full" aria-label="Main">
          <TabList selectedValue={selected} onTabSelect={(_, d) => router.push(String(d.value))}>
            {NAV.map((n) => (
              <Tab key={n.value} value={n.value} icon={n.icon}>
                {n.label}
              </Tab>
            ))}
          </TabList>
        </nav>
      </div>
    </header>
  );
}
