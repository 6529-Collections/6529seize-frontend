"use client";

import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import LatestDropNextMintSection from "./LatestDropNextMintSection";
import NowMintingSection from "./NowMintingSection";
import { useLatestDropTransitionReady } from "./useLatestDropTransitionReady";

export default function LatestDropSection() {
  const { nft, isFetching, isDropComplete, isStatusLoading } =
    useNowMintingStatus();
  const {
    nextMint,
    waveId,
    isFetching: isNextMintFetching,
    isSettingsLoaded,
  } = useNextMintDrop();

  const isNextMintReady = isSettingsLoaded && (!waveId || !isNextMintFetching);
  const isDecisionReady = !isFetching && !isStatusLoading && isNextMintReady;
  const isLatestDropTransitionReady = useLatestDropTransitionReady({
    isDropComplete,
    mintNumber: nft?.id,
  });

  if (!isDecisionReady) {
    return <NowMintingSection nft={undefined} isFetching />;
  }

  const shouldShowNextMint = shouldShowNextMintInLatestDrop({
    isMintEnded: isLatestDropTransitionReady,
    nextMintExists: !!nextMint,
  });

  if (shouldShowNextMint && nextMint) {
    return <LatestDropNextMintSection drop={nextMint} />;
  }

  return <NowMintingSection nft={nft} isFetching={isFetching} />;
}
