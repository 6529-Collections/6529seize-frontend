import { useQuery } from "@tanstack/react-query";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getForgeSettings } from "@/services/api/drop-forge-settings";
import { forgeSettingsKey } from "@/hooks/drop-forge-query-keys";

export function useDropForgeSettings() {
  const { address } = useSeizeConnectContext();
  return useQuery({
    queryKey: forgeSettingsKey(address),
    queryFn: getForgeSettings,
    enabled: !!address,
    retry: false,
  });
}
