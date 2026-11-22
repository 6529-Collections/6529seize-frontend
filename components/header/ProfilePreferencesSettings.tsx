"use client";

import { useAuth } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { CreateWaveInlineGroupBuilderState } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { getWalletAddress, getWalletRole } from "@/services/auth/auth.utils";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
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
import PreferenceRadioOption from "@/components/preferences/PreferenceRadioOption";
import { useContext, useId, useRef, useState } from "react";
import PreferenceToggle from "./PreferenceToggle";
import ProfilePreferencesDirectMessageGroup from "./ProfilePreferencesDirectMessageGroup";

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
  DirectMessagePolicy.GroupMembers,
  DirectMessagePolicy.Nobody,
] as const;

// The API recognizes this fixed group title independently of the UI locale.
const DM_CRITERIA_GROUP_NAME = "Can message me";

const NOTIFICATION_LEVELS = [
  NotificationLevel.All,
  NotificationLevel.EssentialOnly,
] as const;

const RADIO_GROUP_CLASSES = "tw-space-y-4";

const UPDATE_DM_POLICY: Record<DirectMessagePolicy, UpdateDirectMessagePolicy> =
  {
    [DirectMessagePolicy.Everyone]: UpdateDirectMessagePolicy.Everyone,
    [DirectMessagePolicy.PeopleIFollow]:
      UpdateDirectMessagePolicy.PeopleIFollow,
    [DirectMessagePolicy.Nobody]: UpdateDirectMessagePolicy.Nobody,
    [DirectMessagePolicy.GroupMembers]: UpdateDirectMessagePolicy.GroupMembers,
  };

const UPDATE_NOTIFICATION_LEVEL: Record<
  NotificationLevel,
  UpdateNotificationLevel
> = {
  [NotificationLevel.All]: UpdateNotificationLevel.All,
  [NotificationLevel.EssentialOnly]: UpdateNotificationLevel.EssentialOnly,
};

const SECTION_LABELS = {
  notifications: "preferences.tabs.notifications",
  messages: "preferences.tabs.messages",
} as const;

type ProfilePreferencesTab = keyof typeof SECTION_LABELS;
type PreferencesFormProps = {
  readonly preferences: ApiProfilePreferences;
  readonly profileId: string;
};

export default function ProfilePreferencesSettings({
  activeTab,
}: {
  readonly activeTab: ProfilePreferencesTab;
}) {
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
      aria-label={t(locale, SECTION_LABELS[activeTab])}
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
        <div key={profileId}>
          <div hidden={activeTab !== "notifications"}>
            <NotificationPreferencesForm
              preferences={preferencesQuery.data}
              profileId={profileId}
            />
          </div>
          <MessagePreferencesForm
            active={activeTab === "messages"}
            preferences={preferencesQuery.data}
            profileId={profileId}
          />
        </div>
      )}
    </section>
  );
}

function getSavedSection(
  saved: ApiProfilePreferences,
  tab: ProfilePreferencesTab
) {
  if (tab === "notifications") {
    return {
      notification_level: saved.notification_level,
      notifications: saved.notifications,
    };
  }

  return {
    direct_message_policy: saved.direct_message_policy,
    direct_message_group_id: saved.direct_message_group_id,
    direct_message_group_unavailable: saved.direct_message_group_unavailable,
    direct_message_allow_people_i_follow:
      saved.direct_message_allow_people_i_follow,
  };
}

function useSaveProfilePreferences(
  profileId: string,
  tab: ProfilePreferencesTab,
  prepare?: (
    body: ApiUpdateProfilePreferences
  ) => Promise<ApiUpdateProfilePreferences | null>
) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (body: ApiUpdateProfilePreferences) => {
      const update = prepare ? await prepare(body) : body;
      if (update === null) return null;
      return commonApiPut<ApiUpdateProfilePreferences, ApiProfilePreferences>({
        endpoint: "profile-preferences",
        body: update,
      });
    },
    onSuccess: (saved) => {
      if (!saved) return;
      const queryKey = [QueryKey.PROFILE_PREFERENCES, profileId];
      // Responses include both sections and concurrent requests can finish out of order.
      queryClient.setQueryData<ApiProfilePreferences>(queryKey, (cached) =>
        cached ? { ...cached, ...getSavedSection(saved, tab) } : saved
      );
      setToast({
        message: t(locale, "profilePreferences.saveSuccess"),
        type: "success",
      });
      if (tab === "notifications") invalidateNotifications();
    },
    onError: (error: unknown) => {
      console.error("Error saving profile preferences:", error);
      setToast({
        message: t(locale, "profilePreferences.saveError"),
        type: "error",
      });
    },
  });
  return {
    save: (body: ApiUpdateProfilePreferences) =>
      mutation.mutateAsync(body).catch(() => null),
    isSaving: mutation.isPending,
  };
}

function PreferencesSave({
  disabled,
  isSaving,
  requiredHintId,
  onSave,
}: {
  readonly disabled: boolean;
  readonly isSaving: boolean;
  readonly requiredHintId?: string | undefined;
  readonly onSave: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-justify-end tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-px-8">
      <Button
        type="button"
        variant="action"
        size="md"
        disabled={disabled}
        loading={isSaving}
        aria-describedby={requiredHintId}
        onClick={onSave}
      >
        {t(
          locale,
          isSaving ? "profilePreferences.saving" : "profilePreferences.save"
        )}
      </Button>
    </div>
  );
}

function NotificationPreferencesForm({
  profileId,
  preferences,
}: PreferencesFormProps) {
  const locale = useBrowserLocale();
  const [levelDraft, setLevelDraft] = useState<NotificationLevel>();
  const [categoryDraft, setCategoryDraft] = useState<
    Partial<ApiProfileNotificationCategories>
  >({});
  const { save, isSaving } = useSaveProfilePreferences(
    profileId,
    "notifications"
  );
  const prefersReducedMotion = useReducedMotion() ?? false;
  const notificationLevel = levelDraft ?? preferences.notification_level;
  const notifications = { ...preferences.notifications, ...categoryDraft };
  const isEssential = notificationLevel === NotificationLevel.EssentialOnly;
  const changedCategories = CATEGORY_KEYS.filter(
    (key) => notifications[key] !== preferences.notifications[key]
  );
  const body: ApiUpdateProfilePreferences = {};
  if (notificationLevel !== preferences.notification_level) {
    body.notification_level = UPDATE_NOTIFICATION_LEVEL[notificationLevel];
  }
  if (changedCategories.length !== 0) {
    body.notifications = Object.fromEntries(
      changedCategories.map((key) => [key, notifications[key]])
    );
  }
  const updateCategory = (
    key: keyof ApiProfileNotificationCategories,
    checked: boolean
  ) => setCategoryDraft((current) => ({ ...current, [key]: checked }));

  const saveNotifications = async () => {
    if (await save(body)) {
      setLevelDraft(undefined);
      setCategoryDraft({});
    }
  };

  return (
    <>
      <fieldset
        disabled={isSaving}
        className="tw-m-0 tw-min-w-0 tw-border-0 tw-px-4 sm:tw-px-6 lg:tw-px-8"
      >
        <section
          aria-labelledby="profile-preferences-notifications-heading"
          className="tw-pb-8 tw-pt-6 sm:tw-pb-10 sm:tw-pt-8"
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
                    checked={notificationLevel === level}
                    label={label}
                    description={t(
                      locale,
                      `profilePreferences.notifications.${level}.description`
                    )}
                    onChange={() => setLevelDraft(level)}
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
                      <PreferenceToggle
                        key={key}
                        id={`profile-notification-${key}`}
                        checked={notifications[key]}
                        label={t(
                          locale,
                          `profilePreferences.notifications.category.${key}`
                        )}
                        onChange={(checked) => updateCategory(key, checked)}
                      />
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
      </fieldset>
      <PreferencesSave
        disabled={Object.keys(body).length === 0}
        isSaving={isSaving}
        onSave={() => void saveNotifications()}
      />
    </>
  );
}

function useSaveMessagePreferences(
  profileId: string,
  criteria: CreateWaveInlineGroupBuilderState | null
) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const { onGroupCreate } = useContext(ReactQueryWrapperContext);
  const { submit } = useGroupMutations({ requestAuth, onGroupCreate });
  const pendingGroup = useRef<{
    readonly key: string;
    readonly id: string;
  } | null>(null);

  const { save, isSaving } = useSaveProfilePreferences(
    profileId,
    "messages",
    async (body) => {
      if (criteria === null) {
        pendingGroup.current = null;
        return body;
      }
      const wallet = getWalletAddress();
      const role = getWalletRole();
      const key = JSON.stringify([wallet, role, criteria.draft.group]);
      if (pendingGroup.current?.key === key) {
        return { ...body, direct_message_group_id: pendingGroup.current.id };
      }

      pendingGroup.current = null;
      const result = await submit({
        payload: {
          ...criteria.draft,
          name: DM_CRITERIA_GROUP_NAME,
          is_private: true,
        },
        currentHandle: connectedProfile?.handle ?? null,
        publish: true,
      });
      const profileChanged =
        wallet !== getWalletAddress() || role !== getWalletRole();
      // The API can return null when it cannot resolve the group creator.
      const creator = result.ok
        ? (result.group.created_by as ApiProfileMin | null)
        : null;
      if (result.ok && (!profileChanged || creator?.id === profileId)) {
        pendingGroup.current = { key, id: result.group.id };
      }
      if (profileChanged) {
        setToast({
          type: "error",
          message: t(locale, "profilePreferences.saveProfileChanged"),
        });
        return null;
      }
      if (!result.ok) {
        if (result.reason !== "auth") {
          setToast({
            type: "error",
            title: t(locale, "profilePreferences.dm.group.createErrorTitle"),
            description: t(locale, "profilePreferences.dm.group.createError"),
          });
        }
        return null;
      }
      return { ...body, direct_message_group_id: result.group.id };
    }
  );

  return {
    isSaving,
    save: async (body: ApiUpdateProfilePreferences) => {
      const saved = await save(body);
      if (saved) pendingGroup.current = null;
      return saved;
    },
  };
}

function MessagePreferencesForm({
  active,
  profileId,
  preferences,
}: PreferencesFormProps & { readonly active: boolean }) {
  const locale = useBrowserLocale();
  const [policyDraft, setPolicyDraft] = useState<DirectMessagePolicy>();
  const [followDraft, setFollowDraft] = useState<boolean>();
  const [criteriaDraft, setCriteriaDraft] =
    useState<CreateWaveInlineGroupBuilderState | null>(null);
  const policy = policyDraft ?? preferences.direct_message_policy;
  const isGroupPolicy = policy === DirectMessagePolicy.GroupMembers;
  const allowFollowed =
    followDraft ?? preferences.direct_message_allow_people_i_follow;
  const activeCriteria = isGroupPolicy ? criteriaDraft : null;
  const { save, isSaving } = useSaveMessagePreferences(
    profileId,
    activeCriteria
  );
  const requiredHintId = useId();
  if (!active) return null;

  const isMissingCriteria =
    isGroupPolicy &&
    preferences.direct_message_group_id === null &&
    activeCriteria === null;

  const body: ApiUpdateProfilePreferences = {};
  if (policy !== preferences.direct_message_policy) {
    body.direct_message_policy = UPDATE_DM_POLICY[policy];
  }
  if (
    isGroupPolicy &&
    allowFollowed !== preferences.direct_message_allow_people_i_follow
  ) {
    body.direct_message_allow_people_i_follow = allowFollowed;
  }

  const saveMessages = async () => {
    if (await save(body)) {
      setPolicyDraft(undefined);
      setFollowDraft(undefined);
      setCriteriaDraft(null);
    }
  };

  return (
    <>
      <fieldset
        disabled={isSaving}
        className="tw-m-0 tw-min-w-0 tw-border-0 tw-px-4 sm:tw-px-6 lg:tw-px-8"
      >
        <section
          aria-labelledby="profile-preferences-dm-heading"
          className="tw-pb-8 tw-pt-6 sm:tw-pb-10 sm:tw-pt-8"
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
              {DM_OPTIONS.map((option) => (
                <div key={option}>
                  <PreferenceRadioOption
                    name="direct-message-policy"
                    value={option}
                    checked={policy === option}
                    label={t(locale, `profilePreferences.dm.${option}.label`)}
                    description={t(
                      locale,
                      `profilePreferences.dm.${option}.description`
                    )}
                    onChange={() => setPolicyDraft(option)}
                  />
                  {option === DirectMessagePolicy.GroupMembers &&
                    isGroupPolicy && (
                      <ProfilePreferencesDirectMessageGroup
                        groupId={preferences.direct_message_group_id}
                        requiredHintId={requiredHintId}
                        savedGroupUnavailable={
                          preferences.direct_message_group_unavailable
                        }
                        allowPeopleIFollow={allowFollowed}
                        draft={criteriaDraft}
                        disabled={isSaving}
                        onDraftChange={setCriteriaDraft}
                        onAllowPeopleIFollowChange={setFollowDraft}
                      />
                    )}
                </div>
              ))}
            </div>
          </fieldset>
          <p className="tw-mb-0 tw-mt-4 tw-px-4 tw-text-xs tw-leading-5 tw-text-iron-500">
            {t(locale, "profilePreferences.dm.blockNote")}
          </p>
        </section>
      </fieldset>
      <PreferencesSave
        disabled={
          isMissingCriteria ||
          (activeCriteria === null && Object.keys(body).length === 0)
        }
        isSaving={isSaving}
        requiredHintId={isMissingCriteria ? requiredHintId : undefined}
        onSave={() => void saveMessages()}
      />
    </>
  );
}
