"use client";

import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import type { NowMintingStatus } from "@/hooks/useNowMintingStatus";
import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useState } from "react";
import LatestDropNextMintSection from "./LatestDropNextMintSection";
import NowMintingSection from "./NowMintingSection";
import { useLatestDropTransitionReady } from "./useLatestDropTransitionReady";

export default function LatestDropSection({
  mintStatus,
}: {
  readonly mintStatus: NowMintingStatus;
}) {
  const locale = useBrowserLocale();
  const { nft, isFetching, isDropComplete, isStatusLoading, error, refetch } =
    mintStatus;
  const { nextMint, isLoading: isNextMintLoading } = useNextMintDrop();
  const isLatestDropTransitionReady = useLatestDropTransitionReady({
    isDropComplete,
    mintNumber: nft?.id,
  });
  const [resolvedMintNumber, setResolvedMintNumber] = useState<number>();

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

  const isDecisionLoading =
    isStatusLoading ||
    isNextMintLoading ||
    isLatestDropTransitionReady === null;
  // Detail hooks can retry a failed status query when they mount. Keep this
  // mint's resolved panel mounted instead of restarting the initial decision.
  if (nft && !isDecisionLoading && resolvedMintNumber !== nft.id) {
    setResolvedMintNumber(nft.id);
  }
  if (isDecisionLoading && (!nft || resolvedMintNumber !== nft.id)) {
    return <NowMintingSection nft={undefined} isFetching />;
  }

  const shouldShowNextMint = shouldShowNextMintInLatestDrop({
    isMintEnded: isLatestDropTransitionReady === true,
    nextMintExists: !!nextMint,
  });

  if (shouldShowNextMint && nextMint) {
    return <LatestDropNextMintSection drop={nextMint} />;
  }

  // Initial selection waits for the decision; cached data stays visible on refresh.
  return <NowMintingSection nft={nft} isFetching={isFetching} />;
}
