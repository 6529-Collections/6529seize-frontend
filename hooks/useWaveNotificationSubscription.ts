import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveNotificationPreferences } from "@/generated/models/ApiWaveNotificationPreferences";

export function useWaveNotificationSubscription(wave: ApiWave) {
  return useQuery({
    queryKey: ["wave-notification-subscription", wave.id],
    queryFn: () => {
      return commonApiFetch<ApiWaveNotificationPreferences>({
        endpoint: `notifications/wave-subscription/${wave.id}`,
      });
    },
    enabled: !!wave.id && wave.subscribed_actions.length > 0,
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
