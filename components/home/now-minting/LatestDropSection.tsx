"use client";

import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import LatestDropNextMintSection from "./LatestDropNextMintSection";
import NowMintingSection from "./NowMintingSection";
import { useLatestDropTransitionReady } from "./useLatestDropTransitionReady";

export default function LatestDropSection() {
  const locale = useBrowserLocale();
  const { nft, isFetching, isDropComplete, error, refetch } =
    useNowMintingStatus();
  const { nextMint } = useNextMintDrop();
  const isLatestDropTransitionReady = useLatestDropTransitionReady({
    isDropComplete,
    mintNumber: nft?.id,
  });

  if (!nft && error !== null && error !== undefined) {
    return (
      <section className="tw-px-4 tw-py-6 md:tw-px-6 lg:tw-px-8">
        <p role="alert" className="tw-text-sm tw-text-iron-300">
          {t(locale, "home.latestDrop.error")}
        </p>
        <button
          type="button"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
        >
          {t(
            locale,
            isFetching ? "home.latestDrop.retrying" : "home.latestDrop.retry"
          )}
        </button>
      </section>
    );
  }

  const shouldShowNextMint = shouldShowNextMintInLatestDrop({
    isMintEnded: isLatestDropTransitionReady,
    nextMintExists: !!nextMint,
  });

  if (shouldShowNextMint && nextMint) {
    return <LatestDropNextMintSection drop={nextMint} />;
  }

  // Mint status and the next winner enhance the available artwork. Neither
  // an auxiliary outage nor a background refresh should replace it with a skeleton.
  return <NowMintingSection nft={nft} isFetching={isFetching} />;
}
