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

// Far above either collection's holdings; fail rather than publish a truncated
// snapshot if an invalid API response never terminates pagination.
const MAX_BALANCE_PAGES = 100;

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
  const normalizedContract = contract.toLowerCase();

  // A collection's ownership snapshot is independent of the visible grid pages.
  // Keep it cached while scrolling, sorting, or filtering the collection.
  return useQuery<NftOwner[]>({
    queryKey: ["nft-contract-balances", consolidationKey, normalizedContract],
    queryFn: async ({ signal }) => {
      if (!consolidationKey) {
        return [];
      }

      const balances: NftOwner[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        signal.throwIfAborted();
        if (page > MAX_BALANCE_PAGES) {
          throw new Error(
            "Collection balance pagination exceeded its page limit"
          );
        }
        const response = await commonApiFetch<
          DBResponse<NftOwner>,
          Record<string, string>
        >({
          endpoint: `nft-owners/consolidation/${encodeURIComponent(consolidationKey)}`,
          params: {
            contract: normalizedContract,
            page: String(page),
            page_size: "100",
          },
          signal,
          errorMode: "structured",
        });

        if (!Array.isArray(response.data)) {
          throw new TypeError(
            "Collection balance response is missing its data array"
          );
        }
        if (
          response.next !== null &&
          (typeof response.next !== "string" || response.next.trim() === "")
        ) {
          throw new TypeError("Collection balance response has invalid pagination");
        }
        hasNextPage = response.next !== null;
        if (hasNextPage && response.data.length === 0) {
          throw new Error(
            "Collection balance pagination returned an empty intermediate page"
          );
        }
        balances.push(...response.data);
        page += 1;
      }

      // Publish only a complete snapshot: a missing row then means zero balance,
      // rather than an owned token omitted from the first API response page.
      return balances;
    },
    enabled: enabled && !!consolidationKey && tokenIds.length > 0,
  });
}
