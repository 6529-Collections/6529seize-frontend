import {
  formatClaimStatus,
  formatClaimCost,
  formatEditionSize,
} from "@/helpers/manifoldDisplayHelpers";
import { useMemesManifoldClaim } from "@/hooks/useManifoldClaim";
import NowMintingStatsItem from "./NowMintingStatsItem";

interface NowMintingStatsGridProps {
  readonly nftId: number;
  readonly floorPrice: string;
}

export default function NowMintingStatsGrid({
  nftId,
  floorPrice,
}: NowMintingStatsGridProps) {
  const manifoldClaim = useMemesManifoldClaim(nftId);
  const status = manifoldClaim?.status;
  const isStatusLoading = !manifoldClaim;

  const statusLabel = manifoldClaim
    ? formatClaimStatus(manifoldClaim)
    : undefined;
  const statusTone = manifoldClaim?.isFinalized ? "ended" : status;

  const editionSize = manifoldClaim
    ? formatEditionSize(manifoldClaim)
    : undefined;
  const mintPrice = manifoldClaim ? formatClaimCost(manifoldClaim) : undefined;

  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-x-8 tw-gap-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
      <NowMintingStatsItem label="Edition" value={editionSize} />
      <NowMintingStatsItem
        label="Status"
        value={statusLabel}
        status={statusTone}
        isLoading={isStatusLoading}
      />
      <NowMintingStatsItem
        label="Mint price"
        value={mintPrice}
        isLoading={isStatusLoading}
      />
      <NowMintingStatsItem label="Floor" value={floorPrice} />
    </div>
  );
}
