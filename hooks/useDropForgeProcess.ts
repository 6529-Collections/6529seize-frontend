import { ApiDropForgeJobStatusEnum as JobStatus } from "@/generated/models/ApiDropForgeJob";
import { useQuery } from "@tanstack/react-query";
import { latestForgeProcess } from "@/services/api/drop-forge-api";
import { isForgeProcessTargetValid } from "@/services/api/drop-forge-process-inputs";
import {
  dropForgeStatusInterval,
  dropForgeStatusPolling,
} from "@/hooks/drop-forge-status-polling";
export const forgeProcessKey = (
  contract: string,
  claim: number,
  plan: string
) => ["drop-forge-process", contract.toLowerCase(), claim, plan];
export function useDropForgeProcess(
  contract: string,
  claim: number,
  plan: string
) {
  return useQuery({
    queryKey: forgeProcessKey(contract, claim, plan),
    queryFn: () => latestForgeProcess(contract, claim, plan),
    enabled: isForgeProcessTargetValid(claim, plan),
    ...dropForgeStatusPolling,
    refetchInterval: ({ state }) =>
      state.data?.status === JobStatus.Pending
        ? dropForgeStatusInterval(state, 3000)
        : false,
  });
}
