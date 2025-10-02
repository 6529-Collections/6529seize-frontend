import { NextGenToken } from "@/entities/INextgen";
import { commonApiFetch } from "@/services/api/common-api";

const FETCH_SIZE = 50;

interface TokenResponse {
  count: number;
  page: number;
  next: any;
  data: NextGenToken[];
}

export async function fetchInitialTokens(collectionId: number): Promise<NextGenToken[]> {
  try {
    const response = await commonApiFetch<TokenResponse>({
      endpoint: `nextgen/collections/${collectionId}/tokens?page_size=${FETCH_SIZE}&page=1&sort=random`,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch initial tokens:', error);
    return []; // Fallback to empty array if fetch fails
  }
}