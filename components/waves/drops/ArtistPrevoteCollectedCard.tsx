"use client";

import { useAuth } from "@/components/auth/Auth";
import UserPageCollectedCard from "@/components/user/collected/cards/UserPageCollectedCard";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { CollectedCard } from "@/entities/IProfile";
import { useNftBalance } from "@/hooks/useNftBalance";
import { ContractType } from "@/types/enums";
import { useMemo } from "react";

interface ArtistPrevoteCollectedCardProps {
  readonly card: CollectedCard;
}

export function ArtistPrevoteCollectedCard({
  card,
}: Readonly<ArtistPrevoteCollectedCardProps>) {
  const { connectedProfile } = useAuth();
  const { balance: viewerBalance, isLoading: isViewerBalanceLoading } =
    useNftBalance({
      consolidationKey: connectedProfile?.consolidation_key ?? null,
      contract: MEMES_CONTRACT,
      tokenId: card.token_id,
    });

  const cardWithViewerBalance = useMemo<CollectedCard>(() => {
    return {
      ...card,
      seized_count:
        connectedProfile && !isViewerBalanceLoading ? viewerBalance : null,
    };
  }, [card, connectedProfile, isViewerBalanceLoading, viewerBalance]);

  return (
    <div className="tw-flex tw-h-full tw-flex-col">
      <UserPageCollectedCard
        card={cardWithViewerBalance}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="link"
        showZeroSeizedCount={!!connectedProfile && !isViewerBalanceLoading}
        copiesMax={0}
        qtySelected={0}
        selected={false}
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
      />
      {connectedProfile && !isViewerBalanceLoading && (
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
          You own {viewerBalance}
        </p>
      )}
    </div>
  );
}
