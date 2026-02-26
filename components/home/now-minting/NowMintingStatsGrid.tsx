import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";

import { useAuth } from "@/components/auth/Auth";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  formatClaimCost,
  formatClaimStatus,
  formatEditionSize,
} from "@/helpers/manifoldDisplayHelpers";
import { useMemesManifoldClaim } from "@/hooks/useManifoldClaim";
import { useNftBalance } from "@/hooks/useNftBalance";

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

  const { connectedProfile } = useAuth();
  const { balance, isLoading: isBalanceLoading } = useNftBalance({
    consolidationKey: connectedProfile?.consolidation_key ?? null,
    contract: MEMES_CONTRACT,
    tokenId: nftId,
  });

  const statusLabel = manifoldClaim
    ? formatClaimStatus(manifoldClaim)
    : undefined;
  const statusTone = manifoldClaim?.isFinalized ? "ended" : status;

  const editionSize = manifoldClaim
    ? formatEditionSize(manifoldClaim).replace(/\s*\/\s*/, "/")
    : undefined;
  const mintPrice = manifoldClaim ? formatClaimCost(manifoldClaim) : undefined;

  const balanceTooltip = balance > 0 ? `SEIZED x${balance}` : "UNSEIZED";
  const showBalance = connectedProfile && !isBalanceLoading;

  const editionValue = (
    <span className="tw-flex tw-items-center tw-gap-2">
      {editionSize}
      {showBalance && (
        <>
          <span
            data-tooltip-id={`balance-tooltip-${nftId}`}
            className="tw-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-rounded tw-bg-iron-800 tw-p-1.5 tw-font-sans tw-leading-none"
          >
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="tw-size-3 tw-text-iron-400"
            />
            <span className="tw-text-[12px] tw-font-medium tw-text-iron-300">
              {balance}
            </span>
          </span>
          <Tooltip
            id={`balance-tooltip-${nftId}`}
            content={balanceTooltip}
            place="top"
            border="1px solid rgba(255, 255, 255, 0.15)"
            style={{
              backgroundColor: "#26272B",
              color: "white",
              padding: "6px 10px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            }}
          />
        </>
      )}
    </span>
  );

  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-4">
      <NowMintingStatsItem label="Edition" value={editionValue} />
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
