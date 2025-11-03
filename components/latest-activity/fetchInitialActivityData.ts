import { publicEnv } from "@/config/env";
import { DBResponse } from "@/entities/IDBResponse";
import { NFT } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";

export interface InitialActivityData {
  activity: Transaction[];
  totalResults: number;
  nfts: NFT[];
  nextgenCollections: NextGenCollection[];
}

export async function fetchInitialActivityData(
  page: number = 1,
  pageSize: number = 50
): Promise<InitialActivityData> {
  try {
    // Build activity API URL with default filters (All/All)
    const activityUrl = `${publicEnv.API_ENDPOINT}/api/transactions?page_size=${pageSize}&page=${page}`;

    // Fetch all data in parallel
    const [activityResponse, memesResponse, gradientsData, nextgenResponse] =
      await Promise.all([
        // Activity data
        fetchUrl(activityUrl) as Promise<DBResponse>,

        // Memes data
        fetchUrl(
          `${publicEnv.API_ENDPOINT}/api/memes_lite`
        ) as Promise<DBResponse>,

        // Gradients data
        fetchAllPages<NFT>(
          `${publicEnv.API_ENDPOINT}/api/nfts/gradients?&page_size=101`
        ),

        // NextGen collections
        commonApiFetch<{
          count: number;
          page: number;
          next: any;
          data: NextGenCollection[];
        }>({
          endpoint: `nextgen/collections`,
        }),
      ]);

    // Combine memes and gradients
    const nfts = [...memesResponse.data, ...gradientsData];

    return {
      activity: activityResponse.data,
      totalResults: activityResponse.count,
      nfts,
      nextgenCollections: nextgenResponse.data,
    };
  } catch (error) {
    console.error("Error fetching initial activity data:", error);

    // Return empty data on error to allow graceful degradation
    return {
      activity: [],
      totalResults: 0,
      nfts: [],
      nextgenCollections: [],
    };
  }
}
