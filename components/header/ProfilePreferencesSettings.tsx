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
        endpoint: "profiles/preferences",
      }),
    enabled: isOpen,
    staleTime: 0,
  });

  return (
    <MobileWrapperDialog
      title={t(locale, "profilePreferences.title")}
      isOpen={isOpen}
      onClose={onClose}
      fixedHeight
    >
      {preferencesQuery.isLoading && (
        <div
          className="tw-flex tw-flex-1 tw-items-center tw-justify-center"
          role="status"
          aria-label={t(locale, "profilePreferences.loading")}
        >
          <div className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400" />
        </div>
      )}
      {preferencesQuery.isError && (
        <p className="tw-p-6 tw-text-center tw-text-sm tw-text-iron-400">
          {t(locale, "profilePreferences.loadError")}
        </p>
      )}
      {preferencesQuery.data && (
        <ProfilePreferencesForm
          key={JSON.stringify(preferencesQuery.data)}
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
        endpoint: "profiles/preferences",
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
      <>
        <div className="tw-flex-1 tw-space-y-8 tw-overflow-y-auto tw-px-4 tw-py-5 sm:tw-px-6">
          <fieldset>
            <legend className="tw-text-base tw-font-semibold tw-text-iron-100">
              {t(locale, "profilePreferences.dm.heading")}
            </legend>
            <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
              {t(locale, "profilePreferences.dm.description")}
            </p>
            <div className="tw-mt-3 tw-space-y-2">
              {DM_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="tw-flex tw-cursor-pointer tw-gap-3 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-3"
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
          </fieldset>

          <fieldset>
            <legend className="tw-text-base tw-font-semibold tw-text-iron-100">
              {t(locale, "profilePreferences.notifications.heading")}
            </legend>
            <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
              {t(locale, "profilePreferences.notifications.description")}
            </p>
            <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-2">
              {NOTIFICATION_LEVELS.map((level) => (
                <label
                  key={level}
                  className="tw-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-3 tw-text-sm tw-font-medium tw-text-iron-100"
                >
                  <input
                    type="radio"
                    name="notification-level"
                    value={level}
                    checked={current.notification_level === level}
                    onChange={() =>
                      setCurrent({ ...current, notification_level: level })
                    }
                    className="tw-size-4 tw-accent-primary-500"
                  />
                  {t(locale, `profilePreferences.notifications.${level}.label`)}
                </label>
              ))}
            </div>
            <p className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(
                locale,
                `profilePreferences.notifications.${current.notification_level}.description`
              )}
            </p>

            {isEssential && (
              <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-amber-500/30 tw-bg-amber-500/10 tw-p-3 tw-text-xs tw-leading-5 tw-text-amber-200">
                {t(locale, "profilePreferences.notifications.pausedInfo")}
              </div>
            )}

            <div className="tw-mt-4 tw-divide-y tw-divide-iron-800 tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-800">
              {CATEGORY_KEYS.map((key) => (
                <div
                  key={key}
                  className="tw-flex tw-min-h-12 tw-items-center tw-justify-between tw-gap-4 tw-bg-iron-900/40 tw-px-3 tw-py-2.5"
                >
                  {isEssential ? (
                    <span className="tw-text-sm tw-text-iron-200">
                      {t(
                        locale,
                        `profilePreferences.notifications.category.${key}`
                      )}
                    </span>
                  ) : (
                    <label
                      htmlFor={`profile-notification-${key}`}
                      className="tw-text-sm tw-text-iron-200"
                    >
                      {t(
                        locale,
                        `profilePreferences.notifications.category.${key}`
                      )}
                    </label>
                  )}
                  {isEssential ? (
                    <span className="tw-rounded-full tw-bg-iron-700 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300">
                      {t(locale, "profilePreferences.notifications.paused")}
                    </span>
                  ) : (
                    <Toggle
                      id={`profile-notification-${key}`}
                      checked={current.notifications[key]}
                      icons={false}
                      onChange={(event) =>
                        updateCategory(key, event.target.checked)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
              {t(locale, "profilePreferences.notifications.deviceNote")}
            </p>
          </fieldset>
        </div>
        <div className="tw-border-t tw-border-iron-800 tw-bg-iron-950 tw-p-4 sm:tw-px-6">
          <Button
            type="button"
            onClick={() => void save()}
            disabled={!hasChanges}
            loading={isSaving}
            variant="action"
            size="md"
            fullWidth
          >
            {isSaving
              ? t(locale, "profilePreferences.saving")
              : t(locale, "profilePreferences.save")}
          </Button>
        </div>
      </>
    </div>
  );
}
