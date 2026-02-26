import { useQuery } from "@tanstack/react-query";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { GetWaveSubscription200Response } from "@/generated/models/GetWaveSubscription200Response";
import { commonApiFetch } from "@/services/api/common-api";

export function useWaveNotificationSubscription(wave: ApiWave) {
  const { seizeSettings } = useSeizeSettings();
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
    retry: (failureCount) => {
      if (failureCount >= 3) {
        return false;
      }
      return true;
    },
    retryDelay: (failureCount) => {
      return failureCount * 1000;
    },
  });
}
