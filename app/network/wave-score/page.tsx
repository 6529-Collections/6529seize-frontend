import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_BLACK_PAGE_CLASSES,
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
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
    <main className={NETWORK_REFERENCE_BLACK_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/wave-score"
          desktopFlush
          withDivider
        />
        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <WaveScoreTransparencyPage initialReturnTo={returnToParam ?? null} />
        </article>
      </div>
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: "Wave Score | Network",
    description: "Network wave score formula and calculator",
  });
}
