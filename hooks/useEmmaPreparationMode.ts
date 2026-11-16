import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiDropForgePreparationModeEnum as Mode } from "@/generated/models/ApiDropForgePreparation";
import { getForgePreparation } from "@/services/api/drop-forge-api";
import { forgeProcessKey } from "@/hooks/useDropForgeProcess";
import { useDropForgeSettings } from "@/hooks/useDropForgeSettings";

export function useEmmaPreparationMode(
  contract: string,
  tokenId: string | null,
  plan: string | undefined,
  canPrepare: boolean
) {
  const queryClient = useQueryClient();
  const claim = Number(tokenId);
  const queryKey = ["drop-forge-preparation", contract.toLowerCase(), claim];
  const settings = useDropForgeSettings();
  const query = useQuery({
    queryKey,
    queryFn: () => getForgePreparation(contract, claim),
    enabled: canPrepare && !!plan && Number.isSafeInteger(claim) && claim > 0,
    retry: false,
  });
  const savedMode = query.data?.mode;
  const mode =
    savedMode === Mode.Unstarted
      ? settings.data?.preparation_enabled
        ? Mode.Background
        : Mode.Manual
      : savedMode;
  return {
    mode,
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
