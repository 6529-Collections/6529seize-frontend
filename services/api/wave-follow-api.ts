import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiUpdateWaveNotificationPreferencesRequest } from "@/generated/models/ApiUpdateWaveNotificationPreferencesRequest";
import type { ApiWaveNotificationPreferences } from "@/generated/models/ApiWaveNotificationPreferences";
import type { ApiWaveSubscriptionActions } from "@/generated/models/ApiWaveSubscriptionActions";
import {
  personalChange,
  waveFollowItem,
  waveNotifyItem,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";

/**
 * Joins or leaves a wave: today's subscriptions route, or a private
 * `follow` item keyed `wave:<id>`, as the records mode says.
 */
export const setWaveFollowing = (
  waveId: string,
  following: boolean
): Promise<void> =>
  savePersonalSetting({
    legacy: async () => {
      const request = {
        endpoint: `waves/${waveId}/subscriptions`,
        body: { actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS },
      };
      await (following
        ? commonApiPost<ApiWaveSubscriptionActions, ApiWaveSubscriptionActions>(
            request
          )
        : commonApiDeleteWithBody<
            ApiWaveSubscriptionActions,
            ApiWaveSubscriptionActions
          >(request));
    },
    change: () =>
      personalChange({ items: [waveFollowItem(waveId, following)] }),
    recordsResult: () => undefined,
  });

/**
 * A wave's notification settings: every drop, and the groups whose
 * mentions notify. As today, they take effect only while following.
 */
export const updateWaveNotificationPreferences = (
  waveId: string,
  preferences: {
    readonly subscribed: boolean;
    readonly enabled_group_notifications: readonly ApiDropGroupMention[];
  }
): Promise<ApiWaveNotificationPreferences> =>
  savePersonalSetting({
    legacy: () =>
      commonApiPost<
        ApiUpdateWaveNotificationPreferencesRequest,
        ApiWaveNotificationPreferences
      >({
        endpoint: `notifications/wave-subscription/${waveId}`,
        body: {
          subscribed: preferences.subscribed,
          enabled_group_notifications: [
            ...preferences.enabled_group_notifications,
          ],
        },
      }),
    change: () =>
      personalChange({
        items: [
          waveNotifyItem(waveId, {
            allDrops: preferences.subscribed,
            groups: preferences.enabled_group_notifications,
          }),
        ],
      }),
    recordsResult: () => ({
      subscribed: preferences.subscribed,
      enabled_group_notifications: [...preferences.enabled_group_notifications],
    }),
  });

/**
 * After a join: notify on every drop. A join starts with today's default
 * group (ALL), so the record carries that group.
 */
export const subscribeToAllWaveDrops = (waveId: string): Promise<void> =>
  savePersonalSetting({
    legacy: async () => {
      await commonApiPost({
        endpoint: `notifications/wave-subscription/${waveId}`,
        body: {},
      });
    },
    change: () =>
      personalChange({
        items: [
          waveNotifyItem(waveId, {
            allDrops: true,
            groups: [ApiDropGroupMention.All],
          }),
        ],
      }),
    recordsResult: () => undefined,
  });
