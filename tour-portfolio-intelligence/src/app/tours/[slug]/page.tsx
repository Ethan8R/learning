import { notFound } from "next/navigation";
import { TOURS, TOUR_BY_SLUG } from "@/data/seed";
import { TourDetail } from "./tour-detail";

export function generateStaticParams() {
  return TOURS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tours/[slug]">) {
  const { slug } = await params;
  return { title: `${TOUR_BY_SLUG.get(slug)?.name ?? "Tour"} · Tour Portfolio Intelligence` };
}

export default async function TourPage({ params }: PageProps<"/tours/[slug]">) {
  const { slug } = await params;
  if (!TOUR_BY_SLUG.has(slug)) notFound();
  return <TourDetail slug={slug} />;
}
