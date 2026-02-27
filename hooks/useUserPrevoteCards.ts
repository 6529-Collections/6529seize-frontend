"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { CollectedCard } from "@/entities/IProfile";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { ApiNft } from "@/generated/models/ApiNft";
import type { ApiNftsPage } from "@/generated/models/ApiNftsPage";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { commonApiFetch } from "@/services/api/common-api";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface UseUserPrevoteCardsProps {
  readonly user: ApiProfileMin;
  readonly enabled?: boolean | undefined;
}

const toCollectedCard = (nft: ApiNft): CollectedCard => ({
  collection: CollectedCollectionType.MEMES,
  token_id: nft.id,
  token_name: nft.name || `The Memes #${nft.id}`,
  img: nft.scaled,
  tdh: typeof nft.tdh === "number" ? nft.tdh : null,
  rank: typeof nft.tdh_rank === "number" ? nft.tdh_rank : null,
  seized_count: null,
  szn: null,
});

export const useUserPrevoteCards = ({
  user,
  enabled = true,
}: UseUserPrevoteCardsProps) => {
  const prevoteCardIds = useMemo(() => {
    const rawIds = user.artist_of_prevote_cards;
    const uniqueIds = Array.from(
      new Set(rawIds.filter((id) => Number.isFinite(id)))
    );
    uniqueIds.sort((a, b) => b - a);
    return uniqueIds;
  }, [user.artist_of_prevote_cards]);

  const { data, isLoading, isError } = useQuery<ApiNftsPage>({
    queryKey: [
      QueryKey.NFTS,
      {
        contract: MEMES_CONTRACT,
        ids: prevoteCardIds.join(","),
        scope: "artist-prevote-cards",
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiNftsPage>({
        endpoint: "nfts",
        params: {
          contract: MEMES_CONTRACT,
          id: prevoteCardIds.join(","),
        },
      }),
    enabled: enabled && prevoteCardIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const prevoteCards = useMemo(() => {
    if (typeof data?.data.length !== "number") {
      return [];
    }

    const cardsById = new Map<number, CollectedCard>();
    for (const nft of data.data) {
      cardsById.set(nft.id, toCollectedCard(nft));
    }

    return prevoteCardIds
      .map((id) => cardsById.get(id))
      .filter((card): card is CollectedCard => !!card);
  }, [data, prevoteCardIds]);

  return {
    prevoteCards,
    prevoteCardIds,
    isLoading,
    isError,
  };
};
