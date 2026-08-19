"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import { useContext, useState } from "react";
import Toggle from "react-toggle";

interface ProfilePreferencesSettingsProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

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

export default function ProfilePreferencesSettings({
  isOpen,
  onClose,
}: ProfilePreferencesSettingsProps) {
  const locale = useBrowserLocale();
  const preferencesQuery = useQuery({
    queryKey: [QueryKey.PROFILE_PREFERENCES],
    queryFn: () =>
      commonApiFetch<ApiProfilePreferences>({
        endpoint: "profile-preferences",
      }),
    enabled: isOpen,
    staleTime: 0,
  });

  return (
    <MobileWrapperDialog
      title={t(locale, "profilePreferences.title")}
      isOpen={isOpen}
      onClose={onClose}
      noPadding
      tall
      fixedHeight
      headerClassName="tw-pt-5 sm:tw-pt-6"
    >
      {preferencesQuery.isLoading && (
        <output
          className="tw-flex tw-flex-1 tw-items-center tw-justify-center"
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
      {isOpen && preferencesQuery.data && (
        <ProfilePreferencesForm
          preferences={preferencesQuery.data}
          onClose={onClose}
        />
      )}
    </MobileWrapperDialog>
  );
}

function ProfilePreferencesForm({
  preferences,
  onClose,
}: {
  readonly preferences: ApiProfilePreferences;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
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
      setToast({
        message: t(locale, "profilePreferences.saveSuccess"),
        type: "success",
      });
      invalidateNotifications();
      onClose();
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
    <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
      <div className="tw-flex-1 tw-divide-y tw-divide-iron-800 tw-overflow-y-auto tw-px-4 sm:tw-px-6">
        <section
          aria-labelledby="profile-preferences-notifications-heading"
          className="tw-py-5 sm:tw-py-6"
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

          {isEssential && (
            <output className="tw-mt-4 tw-rounded-lg tw-border tw-border-amber-500/30 tw-bg-amber-500/10 tw-p-3 tw-text-xs tw-leading-5 tw-text-amber-200">
              {t(locale, "profilePreferences.notifications.pausedInfo")}
            </output>
          )}

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
          className="tw-py-5 sm:tw-py-6"
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
      <div className="tw-flex tw-justify-end tw-border-t tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-pb-2 tw-pt-3 sm:tw-px-6 sm:tw-pb-3">
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
