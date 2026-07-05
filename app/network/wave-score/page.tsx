import { getAppMetadata } from "@/components/providers/metadata";
import { WaveScoreTransparencyPage } from "@/components/waves/discovery/WaveScoreTransparencyPage";
import type { Metadata } from "next";

interface NetworkWaveScorePageProps {
  readonly searchParams?: Promise<{
    readonly returnTo?: string | string[] | undefined;
  }>;
}

export default async function NetworkWaveScorePage({
  searchParams,
}: NetworkWaveScorePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const returnToParam = Array.isArray(resolvedSearchParams.returnTo)
    ? resolvedSearchParams.returnTo[0]
    : resolvedSearchParams.returnTo;

  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <WaveScoreTransparencyPage initialReturnTo={returnToParam ?? null} />
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: "Wave Score | Network",
    description: "Network wave score formula and calculator",
  });
}
