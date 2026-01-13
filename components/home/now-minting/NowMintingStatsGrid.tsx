import { useMemesManifoldClaim } from "@/hooks/useManifoldClaim";
import NowMintingStatsItem from "./NowMintingStatsItem";

interface NowMintingStatsGridProps {
  readonly nftId: number;
  readonly edition: string;
  readonly mintPrice: string;
  readonly floorPrice: string;
}

export default function NowMintingStatsGrid({
  nftId,
  edition,
  mintPrice,
  floorPrice,
}: NowMintingStatsGridProps) {
  const manifoldClaim = useMemesManifoldClaim(nftId);
  const status = manifoldClaim?.status;
  const isStatusLoading = !manifoldClaim;

  const statusLabel = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : undefined;

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-pt-4">
      <NowMintingStatsItem label="Edition" value={edition} />
      <NowMintingStatsItem label="Mint price" value={mintPrice} />
      <NowMintingStatsItem
        label="Status"
        value={statusLabel}
        status={status}
        isLoading={isStatusLoading}
      />
      <NowMintingStatsItem label="Floor" value={floorPrice} />
    </div>
  );
}
