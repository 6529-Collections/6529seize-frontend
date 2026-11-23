import type {
  ApiProfilePreferences,
  ApiProfilePreferencesDirectMessagePolicyEnum,
  ApiProfilePreferencesNotificationLevelEnum,
} from "@/generated/models/ApiProfilePreferences";
import type { ApiUpdateProfilePreferences } from "@/generated/models/ApiUpdateProfilePreferences";
import type { SealedItem } from "@/lib/signed-records/sealed-crypto";
import {
  personalChange,
  prefItem,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import { commonApiFetch, commonApiPut } from "@/services/api/common-api";

const NOTIFICATION_CATEGORIES = [
  "direct_messages",
  "mentions_replies_quotes",
  "reactions_votes_boosts",
  "new_followers",
  "rep_and_nic",
  "subscription_coverage",
] as const;

/** The saved preferences once the update is applied, as the API would answer. */
function applyUpdate(
  current: ApiProfilePreferences,
  update: ApiUpdateProfilePreferences
): ApiProfilePreferences {
  const policy =
    update.direct_message_policy === undefined
      ? current.direct_message_policy
      : (update.direct_message_policy as string as ApiProfilePreferencesDirectMessagePolicyEnum);
  const groupId =
    update.direct_message_group_id === undefined
      ? current.direct_message_group_id
      : update.direct_message_group_id;
  return {
    ...current,
    direct_message_policy: policy,
    direct_message_group_id: groupId,
    direct_message_allow_people_i_follow:
      update.direct_message_allow_people_i_follow ??
      current.direct_message_allow_people_i_follow,
    direct_message_group_unavailable:
      groupId === current.direct_message_group_id
        ? current.direct_message_group_unavailable
        : false,
    notification_level:
      update.notification_level === undefined
        ? current.notification_level
        : (update.notification_level as string as ApiProfilePreferencesNotificationLevelEnum),
    notifications: { ...current.notifications, ...update.notifications },
  };
}

/**
 * The update as `pref` items: `dm` with the whole direct-message setting
 * after the change, `level`, and one `notify.<category>` per changed
 * category.
 */
function preferenceItems(
  current: ApiProfilePreferences,
  update: ApiUpdateProfilePreferences
): SealedItem[] {
  const next = applyUpdate(current, update);
  const items: SealedItem[] = [];
  if (
    update.direct_message_policy !== undefined ||
    update.direct_message_group_id !== undefined ||
    update.direct_message_allow_people_i_follow !== undefined
  ) {
    items.push(
      prefItem("dm", {
        policy: next.direct_message_policy,
        group_id: next.direct_message_group_id,
        allow_people_i_follow: next.direct_message_allow_people_i_follow,
      })
    );
  }
  if (update.notification_level !== undefined) {
    items.push(prefItem("level", { value: next.notification_level }));
  }
  for (const category of NOTIFICATION_CATEGORIES) {
    const on = update.notifications?.[category];
    if (on !== undefined) {
      items.push(prefItem(`notify.${category}`, { on }));
    }
  }
  return items;
}

/** The saved preferences, read fresh: another tab may have changed them. */
const readSavedPreferences = (): Promise<ApiProfilePreferences> =>
  commonApiFetch<ApiProfilePreferences>({
    endpoint: "profile-preferences",
    cache: "no-store",
  });

/**
 * Saves profile preferences: today's PUT /profile-preferences, or `pref`
 * items. The `dm` item carries the whole direct-message setting, so it is
 * built from the preferences read just before plus this update, never from
 * a tab's cached copy.
 */
export const saveProfilePreferences = (
  update: ApiUpdateProfilePreferences
): Promise<ApiProfilePreferences> => {
  let saved: ApiProfilePreferences | null = null;
  return savePersonalSetting({
    legacy: () =>
      commonApiPut<ApiUpdateProfilePreferences, ApiProfilePreferences>({
        endpoint: "profile-preferences",
        body: update,
      }),
    change: async () => {
      const current = await readSavedPreferences();
      saved = applyUpdate(current, update);
      return personalChange({ items: preferenceItems(current, update) });
    },
    // change() runs before the records are sent, so `saved` is set.
    recordsResult: () => {
      if (!saved) {
        throw new Error("The saved preferences were not read");
      }
      return saved;
    },
  });
};
