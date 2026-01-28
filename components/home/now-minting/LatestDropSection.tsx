"use client";

import { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import LatestDropNextMintSection from "./LatestDropNextMintSection";
import NowMintingSection from "./NowMintingSection";

export default function LatestDropSection() {
  const { nft, isFetching, status } = useNowMintingStatus();
  const { nextMint } = useNextMintDrop();

  const shouldShowNextMint = status === ManifoldClaimStatus.ENDED && !!nextMint;

  if (shouldShowNextMint) {
    return <LatestDropNextMintSection drop={nextMint} />;
  }

  return <NowMintingSection nft={nft} isFetching={isFetching} />;
}
