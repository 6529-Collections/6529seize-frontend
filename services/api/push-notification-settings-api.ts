import type { ApiPushNotificationSettings } from "@/generated/models/ApiPushNotificationSettings";
import {
  personalChange,
  pushItem,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import { commonApiPut } from "@/services/api/common-api";

/**
 * Saves a push device's notification settings: today's route, or a private
 * `push` item keyed by the push device id with all eleven settings.
 */
export const savePushNotificationSettings = (
  deviceId: string,
  settings: ApiPushNotificationSettings
): Promise<ApiPushNotificationSettings> =>
  savePersonalSetting({
    legacy: () =>
      commonApiPut<ApiPushNotificationSettings, ApiPushNotificationSettings>({
        endpoint: `push-notifications/settings/${deviceId}`,
        body: settings,
      }),
    change: () =>
      personalChange({
        items: [
          pushItem(deviceId, {
            identity_subscribed: settings.identity_subscribed,
            identity_mentioned: settings.identity_mentioned,
            identity_rep: settings.identity_rep,
            identity_nic: settings.identity_nic,
            drop_quoted: settings.drop_quoted,
            drop_replied: settings.drop_replied,
            drop_voted: settings.drop_voted,
            drop_reacted: settings.drop_reacted,
            drop_boosted: settings.drop_boosted,
            wave_created: settings.wave_created,
            subscription_coverage: settings.subscription_coverage,
          }),
        ],
      }),
    recordsResult: () => settings,
  });
