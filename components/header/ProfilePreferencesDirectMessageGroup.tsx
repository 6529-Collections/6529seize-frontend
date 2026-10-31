"use client";

import { useAuth } from "@/components/auth/Auth";
import GroupAssignmentDialog from "@/components/groups/assignment/GroupAssignmentDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useGroupCriteria } from "@/hooks/groups/useGroupCriteria";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  ExclamationTriangleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import PreferenceToggle from "./PreferenceToggle";
import { useContext, useId, useState, type ReactNode } from "react";

function SelectedGroupSummary({
  groupId,
  group,
  isLoading,
  isUnavailable,
  isLoadError,
  onRetry,
}: {
  readonly groupId: string | null;
  readonly group: ApiGroupFull | null;
  readonly isLoading: boolean;
  readonly isUnavailable: boolean;
  readonly isLoadError: boolean;
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();
  let content: ReactNode;
  if (groupId === null) {
    content = (
      <span className="tw-text-iron-400">
        {t(locale, "profilePreferences.dm.group.none")}
      </span>
    );
  } else if (isUnavailable) {
    content = (
      <span className="tw-text-iron-400">
        {t(locale, "profilePreferences.dm.group.unavailableName")}
      </span>
    );
  } else if (isLoadError) {
    content = (
      <span className="tw-text-iron-400">
        {t(locale, "profilePreferences.dm.group.loadError")}{" "}
        <button
          type="button"
          onClick={onRetry}
          className="desktop-hover:hover:tw-text-primary-200 tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-font-medium tw-text-primary-300 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "profilePreferences.dm.group.retry")}
        </button>
      </span>
    );
  } else if (isLoading || group === null) {
    content = (
      <span className="tw-text-iron-400">
        {t(locale, "profilePreferences.dm.group.loading")}
      </span>
    );
  } else {
    content = (
      <Link
        href={`/network?page=1&group=${encodeURIComponent(group.id)}`}
        className="desktop-hover:hover:tw-text-primary-200 tw-break-words tw-font-medium tw-text-primary-300 tw-no-underline desktop-hover:hover:tw-underline"
        aria-label={t(locale, "profilePreferences.dm.group.viewMembers", {
          groupName: group.name,
        })}
      >
        {group.name}
      </Link>
    );
  }
  return (
    <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-3">
      <UserGroupIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0 tw-text-iron-400"
      />
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
          {t(locale, "profilePreferences.dm.group.label")}
        </p>
        <p className="tw-m-0 tw-mt-0.5 tw-text-sm">{content}</p>
      </div>
    </div>
  );
}

/**
 * The "Members of a group I choose" settings: the chosen group, the builder
 * to pick or create it, and the "people I follow can always message me"
 * switch. A group the API reports as unavailable fails closed to people the
 * user follows, which the warning explains.
 */
export default function ProfilePreferencesDirectMessageGroup({
  groupId,
  requiredHintId,
  savedGroupUnavailable,
  allowPeopleIFollow,
  onGroupChange,
  onAllowPeopleIFollowChange,
}: {
  readonly groupId: string | null;
  /** Id for the "choose a group" hint, which also describes the Save button. */
  readonly requiredHintId: string;
  /** The API reports the saved group as missing or hidden. */
  readonly savedGroupUnavailable: boolean;
  readonly allowPeopleIFollow: boolean;
  readonly onGroupChange: (group: ApiGroupFull) => void;
  readonly onAllowPeopleIFollowChange: (allow: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const { onGroupCreate } = useContext(ReactQueryWrapperContext);
  const { submit, isSubmitting } = useGroupMutations({
    requestAuth,
    onGroupCreate,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // A group the API already reports as gone is not fetched again.
  const criteria = useGroupCriteria(savedGroupUnavailable ? null : groupId);
  const toggleId = useId();
  const warningId = useId();
  // Only the API decides that the saved group is gone (admission then falls
  // back to people you follow). A failed details request is just retryable.
  const isUnavailable = savedGroupUnavailable;
  const isLoadError = !isUnavailable && groupId !== null && criteria.isError;

  const createGroup = async (
    payload: ApiCreateGroup
  ): Promise<ApiGroupFull | null> => {
    const result = await submit({
      payload,
      currentHandle: connectedProfile?.handle ?? null,
    });
    if (result.ok) {
      return result.group;
    }
    if (result.reason !== "auth") {
      setToast({
        type: "error",
        title: t(locale, "profilePreferences.dm.group.createErrorTitle"),
        description: t(locale, "profilePreferences.dm.group.createError"),
      });
    }
    return null;
  };

  const chooseGroup = (group: ApiGroupFull | null): boolean => {
    if (group === null) {
      return false;
    }
    onGroupChange(group);
    setIsDialogOpen(false);
    return true;
  };

  return (
    <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/40 tw-p-4">
      {isUnavailable && (
        // An alert, not a status: the warning is already present when the
        // panel mounts and asks the user to act, so it must be announced.
        <div
          id={warningId}
          role="alert"
          className="tw-flex tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/40 tw-bg-amber-500/10 tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 tw-text-amber-200"
        >
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0"
          />
          <span>{t(locale, "profilePreferences.dm.group.unavailable")}</span>
        </div>
      )}
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <SelectedGroupSummary
          groupId={groupId}
          group={criteria.criteria?.group ?? null}
          isLoading={criteria.isLoading}
          isUnavailable={isUnavailable}
          isLoadError={isLoadError}
          onRetry={criteria.retry}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="tw-w-full sm:tw-w-auto sm:tw-flex-shrink-0"
          aria-describedby={isUnavailable ? warningId : undefined}
          onClick={() => setIsDialogOpen(true)}
        >
          {groupId === null
            ? t(locale, "profilePreferences.dm.group.choose")
            : t(locale, "profilePreferences.dm.group.change")}
        </Button>
      </div>
      {groupId === null && (
        <p
          id={requiredHintId}
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {t(locale, "profilePreferences.dm.group.required")}
        </p>
      )}
      <div className="-tw-mx-4 -tw-mb-1">
        <PreferenceToggle
          id={toggleId}
          checked={allowPeopleIFollow}
          label={t(locale, "profilePreferences.dm.group.allowFollowed")}
          description={t(
            locale,
            "profilePreferences.dm.group.allowFollowedDescription"
          )}
          onChange={onAllowPeopleIFollowChange}
        />
      </div>
      {isDialogOpen && (
        <GroupAssignmentDialog
          title={t(locale, "profilePreferences.dm.group.dialogTitle")}
          description={t(
            locale,
            "profilePreferences.dm.group.dialogDescription"
          )}
          suggestedName={t(locale, "profilePreferences.dm.group.suggestedName")}
          defaultLabel={t(locale, "profilePreferences.dm.group.none")}
          membersRoleLabel={t(
            locale,
            "profilePreferences.dm.group.membersRoleLabel"
          )}
          selectedGroup={
            isUnavailable ? null : (criteria.criteria?.group ?? null)
          }
          selectedGroupIncludedWallets={criteria.criteria?.includedWallets}
          selectedGroupExcludedWallets={criteria.criteria?.excludedWallets}
          isContentLoading={criteria.isLoading}
          allowGroupClear={false}
          disabled={isSubmitting}
          onClose={() => {
            if (!isSubmitting) {
              setIsDialogOpen(false);
            }
          }}
          onChange={chooseGroup}
          onCreateGroup={createGroup}
        />
      )}
    </div>
  );
}
