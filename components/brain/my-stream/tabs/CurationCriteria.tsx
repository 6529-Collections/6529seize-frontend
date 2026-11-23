"use client";

import { useMobilePageNavigation } from "@/components/mobile-navigation/MobilePageContext";
import { useEffect, useRef, useState, type Ref } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import Button from "@/components/utils/button/Button";
import {
  createInitialInlineGroupBuilderState,
  createInlineGroupBuilderStateFromSavedGroup,
  getInlineGroupDraftSummary,
  getInlineGroupIdentityFromProfile,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useGroupCriteria } from "@/hooks/groups/useGroupCriteria";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useGroupCriteriaIdentityLabels } from "@/hooks/useGroupCriteriaIdentityLabels";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { t } from "@/i18n/messages";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";

const GroupAssignmentPanel = dynamic(
  () => import("@/components/groups/assignment/GroupAssignmentPanel"),
  { loading: () => <CircleLoader /> }
);

export function useCurationCriteriaPreview(
  draft: ApiCreateGroup | null,
  savedGroup: ApiGroupFull | null
): GroupMembersPreviewTarget | null {
  const locale = useBrowserLocale();
  const identityLabels = useGroupCriteriaIdentityLabels(draft?.group ?? null);
  const grantId = draft?.group.is_beneficiary_of_grant_id ?? null;
  const { grant } = useXtdhGrantQuery({
    grantId,
    enabled: grantId !== null,
  });

  if (draft) {
    return {
      kind: "draft",
      group: draft.group,
      summary:
        getInlineGroupDraftSummary({
          draft,
          identityCount: draft.group.identity_addresses?.length ?? 0,
          beneficiaryGrantCollectionName: grant?.target_collection_name,
          identityLabels,
          locale,
        }) ?? t(locale, "waves.create.groups.members.noCriteria"),
    };
  }
  return savedGroup ? { kind: "saved", group: savedGroup } : null;
}

export function CurationCriteriaSummary({
  target,
  fallback,
  editButtonRef,
  disabled,
  onEdit,
  onRetry,
}: {
  readonly target: GroupMembersPreviewTarget | null;
  readonly fallback: string;
  readonly editButtonRef: Ref<HTMLButtonElement>;
  readonly disabled: boolean;
  readonly onEdit: () => void;
  readonly onRetry: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const [previewTarget, setPreviewTarget] =
    useState<GroupMembersPreviewTarget | null>(null);
  const curators = t(locale, "profileCuration.editor.curators");

  return (
    <>
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900/40 tw-p-4">
        <div className="tw-min-w-0 tw-flex-1 tw-basis-40">
          {target ? (
            <GroupMembersPreviewTrigger
              target={target}
              disabled={disabled}
              onOpen={() => setPreviewTarget(target)}
            />
          ) : (
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
              <p
                aria-live="polite"
                className="tw-m-0 tw-text-sm tw-text-iron-400"
              >
                {fallback}
              </p>
              {onRetry && (
                <Button
                  variant="tertiary"
                  size="xs"
                  disabled={disabled}
                  onClick={onRetry}
                >
                  {t(locale, "waves.create.groups.editAccess.retry")}
                </Button>
              )}
            </div>
          )}
        </div>
        <Button
          ref={editButtonRef}
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onEdit}
        >
          {t(locale, "profileCuration.editor.editCriteria")}
        </Button>
      </div>
      {previewTarget && (
        <GroupMembersPreviewDialog
          target={previewTarget}
          roleLabel={curators}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </>
  );
}

export function CurationCriteriaEditor({
  groupId,
  draft,
  target,
  replaceUnavailable,
  onSave,
  onCancel,
}: {
  readonly groupId: string | null;
  readonly draft: ApiCreateGroup | null;
  readonly target: GroupMembersPreviewTarget | null;
  readonly replaceUnavailable: boolean;
  readonly onSave: (draft: ApiCreateGroup) => void;
  readonly onCancel: () => void;
}) {
  const locale = useBrowserLocale();
  const sharedHeader = useMobilePageNavigation(
    t(locale, "profileCuration.editor.editCriteria"),
    onCancel,
    true
  );
  const { connectedProfile } = useAuth();
  const { criteria, isLoading, isError, retry } = useGroupCriteria(
    draft || replaceUnavailable ? null : groupId
  );
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && !editor.contains(document.activeElement)) {
      editor.focus({ preventScroll: true });
    }
  }, []);
  const group = criteria?.group ?? null;
  const defaultIdentity = getInlineGroupIdentityFromProfile(connectedProfile);
  const initialDraft =
    draft ??
    (replaceUnavailable
      ? {
          ...createInitialInlineGroupBuilderState(
            defaultIdentity ? [defaultIdentity] : []
          ).draft,
          is_private: true,
        }
      : undefined);
  const fallback = t(
    locale,
    replaceUnavailable
      ? "profileCuration.editor.criteriaUnavailable"
      : "profileCuration.editor.criteriaRequired"
  );
  const title = t(locale, "profileCuration.editor.editCriteria");
  const curators = t(locale, "profileCuration.editor.curators");

  const saveCriteria = (next: ApiCreateGroup) => {
    if (group && criteria) {
      const current = createInlineGroupBuilderStateFromSavedGroup({
        group,
        includedWallets: criteria.includedWallets,
        excludedWallets: criteria.excludedWallets,
      }).draft;
      if (
        current.is_private === next.is_private &&
        JSON.stringify(current.group) === JSON.stringify(next.group)
      ) {
        onCancel();
        return;
      }
    }
    onSave(next);
  };

  return (
    <div
      ref={editorRef}
      tabIndex={-1}
      aria-label={title}
      role="group"
      className="tw-min-w-0 focus:tw-outline-none"
    >
      {isLoading || isError ? (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          {isLoading ? (
            <output className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-400">
              <CircleLoader />
              {t(locale, "waves.create.groups.members.criteria.loading")}
            </output>
          ) : (
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-400">
                {t(locale, "profileCuration.editor.criteriaUnavailable")}
              </p>
              <Button variant="secondary" size="sm" onClick={retry}>
                {t(locale, "waves.create.groups.editAccess.retry")}
              </Button>
            </div>
          )}
          {!sharedHeader && (
            <Button variant="tertiary" size="sm" onClick={onCancel}>
              {t(locale, "waves.create.actions.cancel")}
            </Button>
          )}
        </div>
      ) : (
        <GroupAssignmentPanel
          suggestedName={curators}
          defaultLabel={fallback}
          selectedGroup={group}
          selectedGroupIncludedWallets={criteria?.includedWallets}
          selectedGroupExcludedWallets={criteria?.excludedWallets}
          defaultMembersPreviewTarget={target ?? undefined}
          membersRoleLabel={curators}
          defaultIncludedIdentity={defaultIdentity}
          initialDraft={initialDraft}
          startMode="criteria"
          presentation="embedded"
          mobileCriteriaNavigation
          isWaveAccessEditor
          allowGroupClear={false}
          showChooseGroup={false}
          collapseOnClickAway={false}
          onCriteriaReplacementChange={(active) => {
            if (!active) onCancel();
          }}
          onSaveDraft={saveCriteria}
        />
      )}
    </div>
  );
}
