import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getForgePreparation } from "@/services/api/drop-forge-api";
import { forgeProcessKey } from "@/hooks/useDropForgeProcess";

export function useEmmaPreparationMode(
  contract: string,
  tokenId: string | null,
  plan: string | undefined,
  canPrepare: boolean
) {
  const queryClient = useQueryClient();
  const claim = Number(tokenId);
  const queryKey = ["drop-forge-preparation", contract.toLowerCase(), claim];
  const query = useQuery({
    queryKey,
    queryFn: () => getForgePreparation(contract, claim),
    enabled: canPrepare && !!plan && Number.isSafeInteger(claim) && claim > 0,
    retry: false,
  });
  return {
    mode: query.data?.mode,
    isError: query.isError,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey });
      if (plan)
        await queryClient.invalidateQueries({
          queryKey: forgeProcessKey(contract, claim, plan),
        });
    },
  };
}
