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

const RADIO_GROUP_CLASSES = "tw-space-y-4";

function PreferenceRadioOption({
  name,
  value,
  checked,
  label,
  description,
  onChange,
}: {
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly label: string;
  readonly description: string;
  readonly onChange: () => void;
}) {
  return (
    <label className="tw-group tw-relative tw-flex tw-w-full tw-cursor-pointer tw-rounded-lg">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        aria-label={label}
        onChange={onChange}
        className="tw-peer tw-sr-only"
      />
      <span
        className={`tw-flex tw-min-h-12 tw-w-full tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-3.5 tw-shadow-sm tw-shadow-black/10 tw-transition-colors tw-duration-200 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-900 peer-disabled:tw-cursor-not-allowed peer-disabled:tw-opacity-50 motion-reduce:tw-transition-none ${
          checked
            ? "tw-border-primary-500 tw-bg-primary-500/10"
            : "tw-border-iron-800 tw-bg-transparent desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900/40"
        }`}
      >
        <span
          aria-hidden="true"
          className={`tw-mt-0.5 tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none ${
            checked
              ? "tw-border-primary-500 tw-bg-primary-500"
              : "tw-border-iron-500 tw-bg-transparent group-hover:tw-border-iron-400"
          }`}
        >
          <span
            className={`tw-size-1.5 tw-rounded-full tw-bg-white tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
              checked ? "tw-scale-100" : "tw-scale-0"
            }`}
          />
        </span>
        <span className="tw-min-w-0">
          <span
            className={`tw-block tw-text-sm tw-font-medium ${
              checked ? "tw-text-iron-50" : "tw-text-iron-200"
            }`}
          >
            {label}
          </span>
          <span
            className={`tw-mt-0.5 tw-block tw-text-xs tw-leading-5 ${
              checked ? "tw-text-primary-300" : "tw-text-iron-400"
            }`}
          >
            {description}
          </span>
        </span>
      </span>
    </label>
  );
}

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
      className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800/80 tw-bg-iron-900/70 tw-shadow-sm tw-shadow-black/20"
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
      <div className="tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <section
          aria-labelledby="profile-preferences-notifications-heading"
          className="tw-pt-6 sm:tw-pt-8"
        >
          <h2
            id="profile-preferences-notifications-heading"
            className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100"
          >
            {t(locale, "profilePreferences.notifications.heading")}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(locale, "profilePreferences.notifications.description")}
          </p>
          <fieldset className="tw-m-0 tw-mt-6 tw-min-w-0 tw-border-0 tw-p-0">
            <legend className="tw-sr-only">
              {t(locale, "profilePreferences.notifications.heading")}
            </legend>
            <div className={RADIO_GROUP_CLASSES}>
              {NOTIFICATION_LEVELS.map((level) => {
                const label = t(
                  locale,
                  `profilePreferences.notifications.${level}.label`
                );

                return (
                  <PreferenceRadioOption
                    key={level}
                    name="notification-level"
                    value={level}
                    checked={current.notification_level === level}
                    label={label}
                    description={t(
                      locale,
                      `profilePreferences.notifications.${level}.description`
                    )}
                    onChange={() =>
                      setCurrent({ ...current, notification_level: level })
                    }
                  />
                );
              })}
            </div>
          </fieldset>

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
                  <div className="tw-mt-6 tw-space-y-1">
                    {CATEGORY_KEYS.map((key) => (
                      <label
                        key={key}
                        htmlFor={`profile-notification-${key}`}
                        className="tw-group tw-relative tw-flex tw-min-h-12 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800/30 motion-reduce:tw-transition-none"
                      >
                        <span className="tw-min-w-0 tw-text-sm tw-font-medium tw-text-iron-300">
                          {t(
                            locale,
                            `profilePreferences.notifications.category.${key}`
                          )}
                        </span>
                        <input
                          id={`profile-notification-${key}`}
                          type="checkbox"
                          checked={current.notifications[key]}
                          onChange={(event) =>
                            updateCategory(key, event.target.checked)
                          }
                          className="tw-peer tw-sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`tw-relative tw-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-p-0.5 tw-transition-colors tw-duration-200 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-900 peer-disabled:tw-opacity-50 motion-reduce:tw-transition-none ${
                            current.notifications[key]
                              ? "tw-border-emerald-400/60 tw-bg-emerald-500"
                              : "tw-border-iron-600 tw-bg-iron-700"
                          }`}
                        >
                          <span
                            className={`tw-size-5 tw-rounded-full tw-bg-iron-50 tw-shadow-sm tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
                              current.notifications[key]
                                ? "tw-translate-x-5"
                                : "tw-translate-x-0"
                            }`}
                          />
                        </span>
                      </label>
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
          <p className="tw-mb-0 tw-mt-4 tw-px-4 tw-text-xs tw-leading-5 tw-text-iron-500">
            {t(locale, "profilePreferences.notifications.deviceNote")}
          </p>
        </section>

        <div aria-hidden="true" className="tw-my-10 tw-h-px tw-bg-iron-800" />

        <section
          aria-labelledby="profile-preferences-dm-heading"
          className="tw-pb-8 sm:tw-pb-10"
        >
          <h2
            id="profile-preferences-dm-heading"
            className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100"
          >
            {t(locale, "profilePreferences.dm.heading")}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(locale, "profilePreferences.dm.description")}
          </p>
          <fieldset className="tw-m-0 tw-mt-6 tw-min-w-0 tw-border-0 tw-p-0">
            <legend className="tw-sr-only">
              {t(locale, "profilePreferences.dm.heading")}
            </legend>
            <div className={RADIO_GROUP_CLASSES}>
              {DM_OPTIONS.map((option) => {
                const label = t(
                  locale,
                  `profilePreferences.dm.${option}.label`
                );

                return (
                  <PreferenceRadioOption
                    key={option}
                    name="direct-message-policy"
                    value={option}
                    checked={current.direct_message_policy === option}
                    label={label}
                    description={t(
                      locale,
                      `profilePreferences.dm.${option}.description`
                    )}
                    onChange={() =>
                      setCurrent({
                        ...current,
                        direct_message_policy: option,
                      })
                    }
                  />
                );
              })}
            </div>
          </fieldset>
        </section>
      </div>
      <div className="tw-mx-4 tw-flex tw-justify-end tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-6 sm:tw-mx-6 lg:tw-mx-8">
        <Button
          type="button"
          onClick={() => void save()}
          disabled={!hasChanges}
          loading={isSaving}
          variant="action"
          size="md"
        >
          {isSaving
            ? t(locale, "profilePreferences.saving")
            : t(locale, "profilePreferences.save")}
        </Button>
      </div>
    </div>
  );
}
