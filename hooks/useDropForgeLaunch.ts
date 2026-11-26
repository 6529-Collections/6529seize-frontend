import { useQuery } from "@tanstack/react-query";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import {
  dropForgeStatusInterval,
  dropForgeStatusPolling,
  hasActiveLaunchWork,
} from "@/hooks/drop-forge-status-polling";
import { getForgeLaunch } from "@/services/api/drop-forge-api";

export function useDropForgeLaunch(
  claimId: number,
  { watch = false, enabled = true }: { watch?: boolean; enabled?: boolean } = {}
) {
  const { contract } = useDropForgeMintingConfig();
  return useQuery({
    queryKey: forgeLaunchKey(contract, claimId),
    queryFn: () => getForgeLaunch(contract, claimId),
    enabled: enabled && claimId > 0,
    ...dropForgeStatusPolling,
    refetchInterval: ({ state }) =>
      watch && hasActiveLaunchWork(state.data)
        ? dropForgeStatusInterval(state, 5000)
        : false,
    staleTime: 5000,
  });
}
