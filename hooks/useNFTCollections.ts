import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { NextGenCollection } from "@/entities/INextgen";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { useEffect, useState } from "react";

interface UseNFTCollectionsReturn {
  // Data
  nfts: NFT[]; // Memes + MemeLab + Gradients
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

  // Fetch Memes, MemeLab, and Gradients collections
  useEffect(() => {
    // Skip fetch if we have initial data
    if (initialCollections && initialCollections.nfts.length > 0) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchCollection = async (
      collectionName: string,
      request: () => Promise<NFT[]>
    ): Promise<NFT[]> => {
      try {
        return await request();
      } catch (error) {
        console.error(`Failed to fetch ${collectionName} collection`, error);
        return [];
      }
    };

    const fetchCollections = async () => {
      const [memes, memeLab, gradients] = await Promise.all([
        fetchCollection("The Memes", async () => {
          const response = await fetchUrl<DBResponse<NFT>>(
            `${publicEnv.API_ENDPOINT}/api/memes_lite`
          );
          return response.data;
        }),
        fetchCollection("MemeLab", async () => {
          const response = await fetchUrl<DBResponse<NFT>>(
            `${publicEnv.API_ENDPOINT}/api/memelab_lite`
          );
          return response.data;
        }),
        fetchCollection("6529 Gradient", () =>
          fetchAllPages<NFT>(
            `${publicEnv.API_ENDPOINT}/api/nfts/gradients?&page_size=101`
          )
        ),
      ]);

      if (!cancelled) {
        setNfts([...memes, ...memeLab, ...gradients]);
        setLoading(false);
      }
    };

    fetchCollections();

    return () => {
      cancelled = true;
    };
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
      next: unknown;
      data: NextGenCollection[];
    }>({
      endpoint: `nextgen/collections`,
    })
      .then((response) => {
        setNextgenCollections(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch NextGen collections list", error);
        setNextgenCollections([]);
      });
  }, [initialCollections]);

  return {
    nfts,
    nextgenCollections,
    loading,
  };
}
