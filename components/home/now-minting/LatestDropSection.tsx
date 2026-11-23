"use client";

import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import type { NowMintingStatus } from "@/hooks/useNowMintingStatus";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, useState } from "react";
import LatestDropNextMintSection from "./LatestDropNextMintSection";
import NowMintingSection from "./NowMintingSection";
import {
  canResolveHomeDrop,
  getHomeDropMintNumber,
  resolveHomeDrop,
  type HomeDropSelection,
} from "./homeDropSelection";
import { useLatestDropTransitionReady } from "./useLatestDropTransitionReady";

export default function LatestDropSection({
  initialDrop = null,
  mintStatus,
}: {
  readonly initialDrop?: HomeDropSelection | null;
  readonly mintStatus: NowMintingStatus;
}) {
  const locale = useBrowserLocale();
  const { nft, isFetching, isDropComplete, error, refetch } = mintStatus;
  const isLatestDropTransitionReady = useLatestDropTransitionReady({
    isDropComplete,
    mintNumber: nft?.id,
  });
  const isMintCompleteAndGraceElapsed =
    isDropComplete && isLatestDropTransitionReady === true;
  const winnerRequestId = useId();
  // A winner request shared with other consumers may have started before grace.
  const winnerRequestScope =
    initialDrop && nft && isMintCompleteAndGraceElapsed
      ? `${winnerRequestId}:${nft.id}`
      : undefined;
  const {
    nextMint,
    isLoading: isNextMintLoading,
    isError: isNextMintError,
    isFetchedAfterMount: hasRefreshedWinner,
  } = useNextMintDrop({ winnerRequestScope });
  const hasHydrated = useHasHydrated();
  const [clientSelection, setClientSelection] = useState<{
    readonly seed: HomeDropSelection | null;
    readonly drop: HomeDropSelection | null;
  } | null>(null);
  const resolvedDrop =
    clientSelection?.seed === initialDrop ? clientSelection.drop : initialDrop;
  const initialMintNumber = getHomeDropMintNumber(initialDrop);

  const isDecisionReady = canResolveHomeDrop({
    mintStatus,
    transitionReadiness: isLatestDropTransitionReady,
    nextMint,
    isNextMintLoading,
    isNextMintError,
  });
  const visibleDrop =
    hasHydrated && nft && isDecisionReady
      ? resolveHomeDrop({
          nft,
          nextMint,
          resolvedDrop,
          hasServerSelection:
            initialMintNumber === nft.id &&
            initialDrop?.kind === resolvedDrop?.kind,
          isMintCompleteAndGraceElapsed,
          hasRefreshedWinner,
        })
      : resolvedDrop;

  if (visibleDrop !== resolvedDrop) {
    setClientSelection({ seed: initialDrop, drop: visibleDrop });
  }

  if (visibleDrop?.kind === "next") {
    return <LatestDropNextMintSection drop={visibleDrop.drop} />;
  }
  if (
    visibleDrop?.kind === "latest" &&
    (!hasHydrated || !nft || visibleDrop.nft.id >= nft.id)
  ) {
    return <NowMintingSection nft={visibleDrop.nft} />;
  }

  if (hasHydrated && !nft && error !== null && error !== undefined) {
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

  return null;
}
