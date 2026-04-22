import ArtFeedPageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function ArtFeedPage() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <ArtFeedPageClient />
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: "ART Feed",
    description: "Curated ART drops from across 6529 Waves",
  });
}
