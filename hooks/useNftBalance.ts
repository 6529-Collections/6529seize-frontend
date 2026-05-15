import { useQuery } from "@tanstack/react-query";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NftOwner } from "@/entities/IOwner";
import { commonApiFetch } from "@/services/api/common-api";

interface UseNftBalanceProps {
  consolidationKey: string | null;
  contract: string;
  tokenId: number;
  enabled?: boolean;
}

export function useNftBalance({
  consolidationKey,
  contract,
  tokenId,
  enabled = true,
}: UseNftBalanceProps) {
  const { data, isLoading, error } = useQuery<DBResponse<NftOwner>>({
    queryKey: ["nft-balance", consolidationKey, contract, tokenId],
    queryFn: async () => {
      if (!consolidationKey) {
        return { count: 0, page: 1, next: false, data: [] };
      }
      return await commonApiFetch<DBResponse<NftOwner>>({
        endpoint: `nft-owners/consolidation/${consolidationKey}?contract=${contract}&token_id=${tokenId}`,
      });
    },
    enabled: enabled && !!consolidationKey,
  });

  const balanceObject: NftOwner | undefined = data?.data?.[0];
  const balance = balanceObject?.balance ?? 0;

  return {
    balance,
    isLoading,
    error,
  };
}

export function useNftContractBalances({
  consolidationKey,
  contract,
  tokenIds,
  enabled = true,
}: {
  readonly consolidationKey: string | null;
  readonly contract: string;
  readonly tokenIds: readonly number[];
  readonly enabled?: boolean;
}) {
  const uniqueTokenIds = Array.from(new Set(tokenIds)).sort((a, b) => a - b);
  const tokenIdsParam = uniqueTokenIds.join(",");

  return useQuery<NftOwner[]>({
    queryKey: [
      "nft-contract-balances",
      consolidationKey,
      contract,
      tokenIdsParam,
    ],
    queryFn: async () => {
      if (!consolidationKey || tokenIdsParam.length === 0) {
        return [];
      }

      const response = await commonApiFetch<
        DBResponse<NftOwner>,
        Record<string, string>
      >({
        endpoint: `nft-owners/consolidation/${consolidationKey}`,
        params: {
          contract,
          token_id: tokenIdsParam,
        },
      });

      return response.data ?? [];
    },
    enabled: enabled && !!consolidationKey && tokenIdsParam.length > 0,
  });
}
