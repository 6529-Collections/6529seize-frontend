import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";

export function useWaveNotificationSubscription(wave: ApiWave) {
  return useQuery({
    queryKey: ["wave-notification-subscription", wave.id],
    queryFn: () => {
      return commonApiFetch<{ subscribed_to_all_drops: boolean }>({
        endpoint: `notifications/subscribe-to-all-drops/${wave.id}`,
      });
    },
    enabled: !!wave.id && wave.metrics.subscribers_count <= 10,
  });
}
