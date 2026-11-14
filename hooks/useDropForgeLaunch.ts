import { useQuery } from "@tanstack/react-query";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import { getForgeLaunch } from "@/services/api/drop-forge-api";

export function useDropForgeLaunch(claimId: number, watch = false) {
  const { contract } = useDropForgeMintingConfig();
  return useQuery({
    queryKey: forgeLaunchKey(contract, claimId),
    queryFn: () => getForgeLaunch(contract, claimId),
    refetchInterval: watch ? 5000 : false,
    staleTime: 5000,
  });
}
