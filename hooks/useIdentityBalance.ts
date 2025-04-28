import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { ApiOwnerBalance } from "../generated/models/ApiOwnerBalance";

export function useIdentityBalance({
  consolidationKey,
}: {
  consolidationKey: string | null;
}) {

const { data, isLoading, error } = useQuery<ApiOwnerBalance>({
  queryKey: ['identity-balance', consolidationKey],
  queryFn: async () =>
    await commonApiFetch<ApiOwnerBalance>({
      endpoint: `owners-balances/consolidation/${consolidationKey}`,
    }),
  enabled: !!consolidationKey,
});
  
  return {
    data,
    isLoading,
    error,
  };
}
