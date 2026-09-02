"use client";

import { useAuth } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiProfileNotificationCategories } from "@/generated/models/ApiProfileNotificationCategories";
import type { ApiProfilePreferences } from "@/generated/models/ApiProfilePreferences";
import {
  ApiProfilePreferencesDirectMessagePolicyEnum as DirectMessagePolicy,
  ApiProfilePreferencesNotificationLevelEnum as NotificationLevel,
} from "@/generated/models/ApiProfilePreferences";
import {
  type ApiUpdateProfilePreferences,
  ApiUpdateProfilePreferencesDirectMessagePolicyEnum as UpdateDirectMessagePolicy,
  ApiUpdateProfilePreferencesNotificationLevelEnum as UpdateNotificationLevel,
} from "@/generated/models/ApiUpdateProfilePreferences";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiFetch, commonApiPut } from "@/services/api/common-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import { useContext, useState } from "react";
import Toggle from "react-toggle";

const CATEGORY_KEYS = [
  "direct_messages",
  "mentions_replies_quotes",
  "reactions_votes_boosts",
  "new_followers",
  "rep_and_nic",
  "subscription_coverage",
] as const satisfies readonly (keyof ApiProfileNotificationCategories)[];

const DM_OPTIONS = [
  DirectMessagePolicy.Everyone,
  DirectMessagePolicy.PeopleIFollow,
  DirectMessagePolicy.Nobody,
] as const;

const NOTIFICATION_LEVELS = [
  NotificationLevel.All,
  NotificationLevel.EssentialOnly,
] as const;

const UPDATE_DM_POLICY: Record<DirectMessagePolicy, UpdateDirectMessagePolicy> =
  {
    [DirectMessagePolicy.Everyone]: UpdateDirectMessagePolicy.Everyone,
    [DirectMessagePolicy.PeopleIFollow]:
      UpdateDirectMessagePolicy.PeopleIFollow,
    [DirectMessagePolicy.Nobody]: UpdateDirectMessagePolicy.Nobody,
  };

const UPDATE_NOTIFICATION_LEVEL: Record<
  NotificationLevel,
  UpdateNotificationLevel
> = {
  [NotificationLevel.All]: UpdateNotificationLevel.All,
  [NotificationLevel.EssentialOnly]: UpdateNotificationLevel.EssentialOnly,
};

export default function ProfilePreferencesSettings() {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const profileId = connectedProfile?.id ?? null;
  const preferencesQuery = useQuery({
    queryKey: [QueryKey.PROFILE_PREFERENCES, profileId],
    queryFn: () =>
      commonApiFetch<ApiProfilePreferences>({
        endpoint: "profile-preferences",
      }),
    enabled: profileId !== null,
    staleTime: 0,
  });

  return (
    <section
      aria-label={t(locale, "preferences.tabs.notifications")}
      className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
    >
      {profileId === null && (
        <p className="tw-m-0 tw-p-6 tw-text-center tw-text-sm tw-text-iron-400">
          {t(locale, "preferences.signIn")}
        </p>
      )}
      {preferencesQuery.isLoading && (
        <output
          className="tw-flex tw-min-h-48 tw-items-center tw-justify-center"
          aria-label={t(locale, "profilePreferences.loading")}
        >
          <div className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400" />
        </output>
      )}
      {preferencesQuery.isError && (
        <p className="tw-p-6 tw-text-center tw-text-sm tw-text-iron-400">
          {t(locale, "profilePreferences.loadError")}
        </p>
      )}
      {profileId && preferencesQuery.data && (
        <ProfilePreferencesForm
          key={profileId}
          preferences={preferencesQuery.data}
          profileId={profileId}
        />
      )}
    </section>
  );
}

function ProfilePreferencesForm({
  preferences,
  profileId,
}: {
  readonly preferences: ApiProfilePreferences;
  readonly profileId: string;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
  const queryClient = useQueryClient();
  const [original, setOriginal] = useState(preferences);
  const [current, setCurrent] = useState(preferences);
  const prefersReducedMotion = useReducedMotion() ?? false;

  const hasChanges = JSON.stringify(original) !== JSON.stringify(current);

  const { mutateAsync: save, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const body: ApiUpdateProfilePreferences = {
        direct_message_policy: UPDATE_DM_POLICY[current.direct_message_policy],
        notification_level:
          UPDATE_NOTIFICATION_LEVEL[current.notification_level],
        notifications: current.notifications,
      };
      return commonApiPut<ApiUpdateProfilePreferences, ApiProfilePreferences>({
        endpoint: "profile-preferences",
        body,
      });
    },
    onSuccess: (savedPreferences) => {
      setOriginal(savedPreferences);
      setCurrent(savedPreferences);
      queryClient.setQueryData(
        [QueryKey.PROFILE_PREFERENCES, profileId],
        savedPreferences
      );
      setToast({
        message: t(locale, "profilePreferences.saveSuccess"),
        type: "success",
      });
      invalidateNotifications();
    },
    onError: (error: unknown) => {
      console.error("Error saving profile preferences:", error);
      setToast({
        message: t(locale, "profilePreferences.saveError"),
        type: "error",
      });
    },
  });

  const updateCategory = (
    key: keyof ApiProfileNotificationCategories,
    value: boolean
  ) => {
    setCurrent((previous) => ({
      ...previous,
      notifications: { ...previous.notifications, [key]: value },
    }));
  };

  const isEssential =
    current.notification_level === NotificationLevel.EssentialOnly;

  return (
    <div className="tw-flex tw-flex-col">
      <div className="tw-divide-y tw-divide-iron-800 tw-px-4 sm:tw-px-6">
        <section
          aria-labelledby="profile-preferences-notifications-heading"
          className="tw-pb-0 tw-pt-6"
        >
          <h2
            id="profile-preferences-notifications-heading"
            className="tw-text-base tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "profilePreferences.notifications.heading")}
          </h2>
          <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(locale, "profilePreferences.notifications.description")}
          </p>
          <div className="tw-mt-4 tw-divide-y tw-divide-white/5 tw-overflow-hidden tw-rounded-lg tw-bg-white/[0.025] tw-ring-1 tw-ring-white/10">
            {NOTIFICATION_LEVELS.map((level) => (
              <label
                key={level}
                aria-label={t(
                  locale,
                  `profilePreferences.notifications.${level}.label`
                )}
                className="tw-flex tw-cursor-pointer tw-items-start tw-gap-3 tw-px-3 tw-py-3 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.035]"
              >
                <input
                  type="radio"
                  name="notification-level"
                  value={level}
                  checked={current.notification_level === level}
                  onChange={() =>
                    setCurrent({ ...current, notification_level: level })
                  }
                  className="tw-mt-1 tw-size-4 tw-accent-primary-500"
                />
                <span>
                  <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-100">
                    {t(
                      locale,
                      `profilePreferences.notifications.${level}.label`
                    )}
                  </span>
                  <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                    {t(
                      locale,
                      `profilePreferences.notifications.${level}.description`
                    )}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <LazyMotion features={domAnimation}>
            <AnimatePresence initial={false}>
              {!isEssential && (
                <m.div
                  key="optional-notification-categories"
                  initial={
                    prefersReducedMotion
                      ? false
                      : { height: 0, opacity: 0, y: -8 }
                  }
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { height: 0, opacity: 0, y: -8 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.18,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="tw-overflow-hidden"
                >
                  <div className="tw-mt-4 tw-divide-y tw-divide-iron-800 tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-800">
                    {CATEGORY_KEYS.map((key) => (
                      <div
                        key={key}
                        className="tw-flex tw-min-h-12 tw-items-center tw-justify-between tw-gap-4 tw-bg-iron-900/40 tw-px-3 tw-py-2.5"
                      >
                        <label
                          htmlFor={`profile-notification-${key}`}
                          className="tw-text-sm tw-text-iron-200"
                        >
                          {t(
                            locale,
                            `profilePreferences.notifications.category.${key}`
                          )}
                        </label>
                        <Toggle
                          id={`profile-notification-${key}`}
                          checked={current.notifications[key]}
                          icons={false}
                          onChange={(event) =>
                            updateCategory(key, event.target.checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
          <p className="tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
            {t(locale, "profilePreferences.notifications.deviceNote")}
          </p>
        </section>

        <section
          aria-labelledby="profile-preferences-dm-heading"
          className="tw-pb-0 tw-pt-6"
        >
          <h2
            id="profile-preferences-dm-heading"
            className="tw-text-base tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "profilePreferences.dm.heading")}
          </h2>
          <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(locale, "profilePreferences.dm.description")}
          </p>
          <div className="tw-mt-4 tw-divide-y tw-divide-white/5 tw-overflow-hidden tw-rounded-lg tw-bg-white/[0.025] tw-ring-1 tw-ring-white/10">
            {DM_OPTIONS.map((option) => (
              <label
                key={option}
                aria-label={t(locale, `profilePreferences.dm.${option}.label`)}
                className="tw-flex tw-cursor-pointer tw-gap-3 tw-px-3 tw-py-3 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.035]"
              >
                <input
                  type="radio"
                  name="direct-message-policy"
                  value={option}
                  checked={current.direct_message_policy === option}
                  onChange={() =>
                    setCurrent({
                      ...current,
                      direct_message_policy: option,
                    })
                  }
                  className="tw-mt-1 tw-size-4 tw-accent-primary-500"
                />
                <span>
                  <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-100">
                    {t(locale, `profilePreferences.dm.${option}.label`)}
                  </span>
                  <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                    {t(locale, `profilePreferences.dm.${option}.description`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
      <div className="tw-flex tw-justify-end tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-pb-4 tw-pt-6 sm:tw-px-6 sm:tw-pb-5">
        <Button
          type="button"
          onClick={() => void save()}
          disabled={!hasChanges}
          loading={isSaving}
          variant="action"
          size="md"
          className="tw-w-full sm:tw-w-auto sm:tw-min-w-40"
        >
          {isSaving
            ? t(locale, "profilePreferences.saving")
            : t(locale, "profilePreferences.save")}
        </Button>
      </div>
    </div>
  );
}
