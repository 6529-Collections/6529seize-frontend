import { useEffect, useState } from "react";
import { NFT } from "../entities/INFT";
import { NextGenCollection } from "../entities/INextgen";
import { DBResponse } from "../entities/IDBResponse";
import { fetchAllPages, fetchUrl } from "../services/6529api";
import { commonApiFetch } from "../services/api/common-api";

interface UseNFTCollectionsReturn {
  // Data
  nfts: NFT[];                          // Memes + Gradients
  nextgenCollections: NextGenCollection[];
  
  // Loading state
  loading: boolean;
}

export function useNFTCollections(): UseNFTCollectionsReturn {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nextgenCollections, setNextgenCollections] = useState<NextGenCollection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Memes and Gradients collections
  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/memes_lite`).then(
      (memeResponse: DBResponse) => {
        setNfts(memeResponse.data);
        fetchAllPages(
          `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101`
        ).then((gradients: NFT[]) => {
          setNfts([...memeResponse.data, ...gradients]);
          setLoading(false);
        });
      }
    );
  }, []);

  // Fetch NextGen collections
  useEffect(() => {
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
  }, []);

  return {
    nfts,
    nextgenCollections,
    loading,
  };
}