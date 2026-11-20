"use client";

import GroupAssignmentDialog from "@/components/groups/assignment/GroupAssignmentDialog";
import Button from "@/components/utils/button/Button";
import {
  createInlineGroupBuilderStateFromSavedGroup,
  type CreateWaveInlineGroupBuilderState,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import { useGroupCriteria } from "@/hooks/groups/useGroupCriteria";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useId, useState } from "react";
import PreferenceToggle from "./PreferenceToggle";

export default function ProfilePreferencesDirectMessageGroup({
  groupId,
  requiredHintId,
  savedGroupUnavailable,
  allowPeopleIFollow,
  draft,
  disabled,
  onDraftChange,
  onAllowPeopleIFollowChange,
}: {
  readonly groupId: string | null;
  readonly requiredHintId: string;
  readonly savedGroupUnavailable: boolean;
  readonly allowPeopleIFollow: boolean;
  readonly draft: CreateWaveInlineGroupBuilderState | null;
  readonly disabled: boolean;
  readonly onDraftChange: (
    draft: CreateWaveInlineGroupBuilderState | null
  ) => void;
  readonly onAllowPeopleIFollowChange: (allow: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const [open, setOpen] = useState(false);
  const { criteria, isLoading, isError, retry } = useGroupCriteria(
    open && !savedGroupUnavailable ? groupId : null
  );
  const toggleId = useId();
  const needsCriteria = groupId === null && draft === null;
  const suggestedName = t(locale, "profilePreferences.dm.group.suggestedName");

  const applyCriteria = (next: CreateWaveInlineGroupBuilderState) => {
    const saved = criteria?.group
      ? createInlineGroupBuilderStateFromSavedGroup({
          group: criteria.group,
          includedWallets: criteria.includedWallets,
          excludedWallets: criteria.excludedWallets,
        })
      : null;
    const unchanged =
      saved !== null &&
      JSON.stringify(saved.draft.group) === JSON.stringify(next.draft.group);
    onDraftChange(unchanged ? null : next);
    setOpen(false);
  };

  return (
    <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/40 tw-p-4">
      {savedGroupUnavailable && draft === null && (
        <p
          role="alert"
          className="tw-m-0 tw-flex tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/40 tw-bg-amber-500/10 tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 tw-text-amber-200"
        >
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-4 tw-shrink-0"
          />
          <span>{t(locale, "profilePreferences.dm.group.unavailable")}</span>
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          aria-describedby={needsCriteria ? requiredHintId : undefined}
          onClick={() => setOpen(true)}
        >
          {t(
            locale,
            needsCriteria
              ? "profilePreferences.dm.group.setCriteria"
              : "profilePreferences.dm.group.editCriteria"
          )}
        </Button>
        {needsCriteria && (
          <p
            id={requiredHintId}
            className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {t(locale, "profilePreferences.dm.group.required")}
          </p>
        )}
      </div>
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
      {open && (
        <GroupAssignmentDialog
          title={t(locale, "profilePreferences.dm.group.dialogTitle")}
          description={t(
            locale,
            "profilePreferences.dm.group.dialogDescription"
          )}
          suggestedName={suggestedName}
          defaultLabel={suggestedName}
          membersRoleLabel={suggestedName}
          selectedGroup={criteria?.group ?? null}
          selectedGroupIncludedWallets={criteria?.includedWallets}
          selectedGroupExcludedWallets={criteria?.excludedWallets}
          isContentLoading={draft === null && isLoading}
          contentError={draft === null && isError}
          onRetry={retry}
          onClose={() => setOpen(false)}
          criteriaDraft={{
            initial: draft ?? undefined,
            onApply: applyCriteria,
          }}
        />
      )}
    </div>
  );
}
