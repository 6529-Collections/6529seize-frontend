import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";
import { useSeizeSettings } from "../contexts/SeizeSettingsContext";
import { GetWaveSubscription200Response } from "../generated/models/GetWaveSubscription200Response";

export function useWaveNotificationSubscription(wave: ApiWave) {
  const seizeSettings = useSeizeSettings();
  return useQuery({
    queryKey: ["wave-notification-subscription", wave.id],
    queryFn: () => {
      return commonApiFetch<GetWaveSubscription200Response>({
        endpoint: `notifications/wave-subscription/${wave.id}`,
      });
    },
    enabled:
      !!wave.id &&
      wave.metrics.subscribers_count <=
        seizeSettings.all_drops_notifications_subscribers_limit,
  });
}
