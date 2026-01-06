import { useQuery } from "@tanstack/react-query";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NftOwner } from "@/entities/IOwner";
import { commonApiFetch } from "@/services/api/common-api";

interface UseNftBalanceProps {
  consolidationKey: string | null;
  contract: string;
  tokenId: number;
}

export function useNftBalance({
  consolidationKey,
  contract,
  tokenId,
}: UseNftBalanceProps) {
  const { data, isLoading, error } = useQuery<DBResponse>({
    queryKey: ["nft-balance", consolidationKey, contract, tokenId],
    queryFn: async () =>
      await commonApiFetch<DBResponse>({
        endpoint: `nft-owners/consolidation/${consolidationKey}?contract=${contract}&token_id=${tokenId}`,
      }),
    enabled: !!consolidationKey,
  });

  const balanceObject: NftOwner | undefined = data?.data?.[0];
  const balance = balanceObject?.balance ?? 0;

  return {
    balance,
    isLoading,
    error,
  };
}
