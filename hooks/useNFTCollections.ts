import { publicEnv } from "@/config/env";
import type { NFT } from "@/entities/INFT";
import type { NextGenCollection } from "@/entities/INextgen";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { useEffect, useState } from "react";

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

    let cancelled = false;
    setLoading(true);

    const fetchCollections = async () => {
      try {
        const memeResponse = await fetchUrl(
          `${publicEnv.API_ENDPOINT}/api/memes_lite`
        );
        if (cancelled) {
          return;
        }
        const gradients = await fetchAllPages<NFT>(
          `${publicEnv.API_ENDPOINT}/api/nfts/gradients?&page_size=101`
        );
        if (cancelled) {
          return;
        }
        setNfts([...memeResponse.data, ...gradients]);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch NFT collections", error);
          setNfts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
      next: any;
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
