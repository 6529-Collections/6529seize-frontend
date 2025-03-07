import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";
import { useSeizeSettings } from "../contexts/SeizeSettingsContext";

export function useWaveNotificationSubscription(wave: ApiWave) {
  const seizeSettings = useSeizeSettings();
  return useQuery({
    queryKey: ["wave-notification-subscription", wave.id],
    queryFn: () => {
      return commonApiFetch<{ subscribed_to_all_drops: boolean }>({
        endpoint: `notifications/subscribe-to-all-drops/${wave.id}`,
      });
    },
    enabled:
      !!wave.id &&
      wave.metrics.subscribers_count <=
        seizeSettings.all_drops_notifications_subscribers_limit,
  });
}
