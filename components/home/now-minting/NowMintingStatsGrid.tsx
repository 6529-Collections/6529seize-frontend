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

  const statusLabel =
    status && status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-border-y tw-border-iron-800 tw-py-4">
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
