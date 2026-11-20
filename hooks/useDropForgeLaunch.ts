import { useQuery } from "@tanstack/react-query";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { ApiDropForgeActionStateEnum as ActionState } from "@/generated/models/ApiDropForgeAction";
import {
  ApiDropForgeLaunchStateEnum as LaunchState,
  type ApiDropForgeLaunch,
} from "@/generated/models/ApiDropForgeLaunch";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import {
  dropForgeStatusInterval,
  dropForgeStatusPolling,
} from "@/hooks/drop-forge-status-polling";
import { getForgeLaunch } from "@/services/api/drop-forge-api";

export function hasActiveLaunchWork(
  launch: ApiDropForgeLaunch | null | undefined
): boolean {
  return (
    launch !== undefined &&
    launch !== null &&
    (launch.state === LaunchState.Armed ||
      launch.state === LaunchState.Running ||
      launch.manual_pending === true ||
      launch.actions.some((action) => action.state === ActionState.Signed))
  );
}

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
