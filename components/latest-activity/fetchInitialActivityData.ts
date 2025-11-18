import { DBResponse } from "@/entities/IDBResponse";
import { NFT } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
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
    // Fetch all data in parallel
    const [
      activityResponse,
      memesResponse,
      gradientsResponse,
      nextgenResponse,
    ] = await Promise.all([
      // Activity data
      commonApiFetch<DBResponse>({
        endpoint: "transactions",
        params: {
          page_size: String(pageSize),
          page: String(page),
        },
      }),

      // Memes data
      commonApiFetch<DBResponse<NFT>>({
        endpoint: "memes_lite",
      }),

      // Gradients data (first page only, page_size 101)
      commonApiFetch<DBResponse<NFT>>({
        endpoint: "nfts/gradients",
        params: {
          page_size: "101",
        },
      }),

      // NextGen collections
      commonApiFetch<DBResponse<NextGenCollection>>({
        endpoint: `nextgen/collections`,
      }),
    ]);

    // Combine memes and gradients
    const nfts = [...memesResponse.data, ...gradientsResponse.data];

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
