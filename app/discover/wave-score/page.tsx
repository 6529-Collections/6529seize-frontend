import { getAppMetadata } from "@/components/providers/metadata";
import { WaveScoreTransparencyPage } from "@/components/waves/discovery/WaveScoreTransparencyPage";
import type { Metadata } from "next";

export default function DiscoverWaveScorePage() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <WaveScoreTransparencyPage />
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: "Wave Score",
    description: "Wave score formula and calculator",
  });
}
