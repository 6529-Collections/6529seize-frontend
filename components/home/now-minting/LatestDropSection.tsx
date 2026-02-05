"use client";

import { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import LatestDropNextMintSection from "./LatestDropNextMintSection";
import NowMintingSection from "./NowMintingSection";

export default function LatestDropSection() {
  const { nft, isFetching, status } = useNowMintingStatus();
  const { nextMint } = useNextMintDrop();

  const shouldShowNextMint = shouldShowNextMintInLatestDrop({
    isMintEnded: status === ManifoldClaimStatus.ENDED,
    nextMintExists: !!nextMint,
  });

  if (shouldShowNextMint && nextMint) {
    return <LatestDropNextMintSection drop={nextMint} />;
  }

  return <NowMintingSection nft={nft} isFetching={isFetching} />;
}
