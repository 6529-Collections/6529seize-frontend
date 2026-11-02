"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import { useAuth } from "@/components/auth/Auth";
import UserPageCollectedCard from "@/components/user/collected/cards/UserPageCollectedCard";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { CollectedCard } from "@/entities/IProfile";
import type { ArtistPrevoteCard } from "@/hooks/useUserPrevoteCards";
import { useNftBalance } from "@/hooks/useNftBalance";
import { ContractType } from "@/types/enums";
import { useMemo } from "react";

interface ArtistPrevoteCollectedCardProps {
  readonly card: ArtistPrevoteCard;
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
    <div className="tw-flex tw-h-full tw-flex-col [&>a>div]:tw-flex-1 [&>a]:tw-flex [&>a]:tw-flex-1 [&_.tw-items-baseline>span:last-child]:tw-font-normal [&_.tw-items-baseline>span:last-child]:tw-text-iron-500 [&_.tw-items-baseline>span]:tw-text-sm [&_.tw-items-baseline>span]:tw-tabular-nums">
      <UserPageCollectedCard
        card={cardWithViewerBalance}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        mediaBadge={
          <MediaTypeBadge
            mimeType={card.mediaMimeType}
            dropId={`artist-meme-${card.token_id}`}
            size="sm"
            iconClassName="focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            tooltipPortal
            tooltipZIndex={1000002}
          />
        }
        interactiveMode="link"
        showZeroSeizedCount={!!connectedProfile && !isViewerBalanceLoading}
        copiesMax={0}
        qtySelected={0}
        selected={false}
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
      />
    </div>
  );
}
