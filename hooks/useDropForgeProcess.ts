import { ApiDropForgeJobStatusEnum as JobStatus } from "@/generated/models/ApiDropForgeJob";
import { useQuery } from "@tanstack/react-query";
import { latestForgeProcess } from "@/services/api/drop-forge-api";
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
    enabled: claim > 0 && !!plan,
    refetchInterval: (query) =>
      query.state.data?.status === JobStatus.Pending ? 3000 : false,
  });
}
