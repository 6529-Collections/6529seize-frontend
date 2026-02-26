"use client";

import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";

import LatestDropNextMintSection from "./LatestDropNextMintSection";
import NowMintingSection from "./NowMintingSection";

export default function LatestDropSection() {
  const { nft, isFetching, status, isStatusLoading } = useNowMintingStatus();
  const {
    nextMint,
    waveId,
    isFetching: isNextMintFetching,
    isSettingsLoaded,
  } = useNextMintDrop();

  const isNextMintReady = isSettingsLoaded && (!waveId || !isNextMintFetching);
  const isDecisionReady = !isFetching && !isStatusLoading && isNextMintReady;

  if (!isDecisionReady) {
    return <NowMintingSection nft={undefined} isFetching />;
  }

  const shouldShowNextMint = shouldShowNextMintInLatestDrop({
    isMintEnded: status === ManifoldClaimStatus.ENDED,
    nextMintExists: !!nextMint,
  });

  if (shouldShowNextMint && nextMint) {
    return <LatestDropNextMintSection drop={nextMint} />;
  }

  return <NowMintingSection nft={nft} isFetching={isFetching} />;
}
