import { publicEnv } from "@/config/env";
import { useEffect, useState } from "react";
import { DBResponse } from "@/entities/IDBResponse";
import { NFT } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";

interface UseNFTCollectionsReturn {
  // Data
  nfts: NFT[]; // Memes + Gradients
  nextgenCollections: NextGenCollection[];

  // Loading state
  loading: boolean;
}

export function useNFTCollections(initialCollections?: {
  nfts: NFT[];
  nextgenCollections: NextGenCollection[];
}): UseNFTCollectionsReturn {
  const [nfts, setNfts] = useState<NFT[]>(initialCollections?.nfts || []);
  const [nextgenCollections, setNextgenCollections] = useState<
    NextGenCollection[]
  >(initialCollections?.nextgenCollections || []);
  const [loading, setLoading] = useState(!initialCollections);

  // Fetch Memes and Gradients collections
  useEffect(() => {
    // Skip fetch if we have initial data
    if (initialCollections && initialCollections.nfts.length > 0) {
      return;
    }

    fetchUrl(`${publicEnv.API_ENDPOINT}/api/memes_lite`).then(
      (memeResponse: DBResponse) => {
        setNfts(memeResponse.data);
        fetchAllPages(
          `${publicEnv.API_ENDPOINT}/api/nfts/gradients?&page_size=101`
        ).then((gradients: NFT[]) => {
          setNfts([...memeResponse.data, ...gradients]);
          setLoading(false);
        });
      }
    );
  }, [initialCollections]);

  // Fetch NextGen collections
  useEffect(() => {
    // Skip fetch if we have initial data
    if (
      initialCollections &&
      initialCollections.nextgenCollections.length > 0
    ) {
      return;
    }

    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenCollection[];
    }>({
      endpoint: `nextgen/collections`,
    }).then((response) => {
      setNextgenCollections(response.data);
    });
  }, [initialCollections]);

  return {
    nfts,
    nextgenCollections,
    loading,
  };
}
