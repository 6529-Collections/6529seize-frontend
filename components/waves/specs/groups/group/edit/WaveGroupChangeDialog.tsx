"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowPathIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import GroupAssignmentDialog from "@/components/groups/assignment/GroupAssignmentDialog";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import Button from "@/components/utils/button/Button";
import { buildInlineGroupName } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "@/helpers/waves/waves.constants";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { CreateWaveGroupConfigType } from "@/types/waves.types";
import { WaveGroupType } from "../WaveGroup.types";
import { areWaveGroupCriteriaEqual } from "./buttons/utils/waveGroupCriteriaMatch";
import { useWaveGroupCriteria } from "./hooks/useWaveGroupCriteria";

const WAVE_GROUP_TO_CREATE_GROUP_TYPE = {
  [WaveGroupType.VIEW]: CreateWaveGroupConfigType.CAN_VIEW,
  [WaveGroupType.DROP]: CreateWaveGroupConfigType.CAN_DROP,
  [WaveGroupType.VOTE]: CreateWaveGroupConfigType.CAN_VOTE,
  [WaveGroupType.CHAT]: CreateWaveGroupConfigType.CAN_CHAT,
  [WaveGroupType.ADMIN]: CreateWaveGroupConfigType.ADMIN,
} satisfies Record<WaveGroupType, CreateWaveGroupConfigType>;

const VISIBILITY_MATCH_TYPES = new Set<WaveGroupType>([
  WaveGroupType.DROP,
  WaveGroupType.VOTE,
  WaveGroupType.CHAT,
]);

const MAKE_PUBLIC_ACTION = "make-public";

const EDIT_ACCESS_MESSAGES = {
  title: "waves.create.groups.editAccess.title",
  description: "waves.create.groups.editAccess.description",
  makePublic: "waves.create.groups.editAccess.makePublic",
  makePublicDescription: "waves.create.groups.editAccess.makePublicDescription",
  useVisibility: "waves.create.groups.editAccess.useVisibility",
  useVisibilityDescription:
    "waves.create.groups.editAccess.useVisibilityDescription",
  useVisibilityPublicDescription:
    "waves.create.groups.editAccess.useVisibilityPublicDescription",
  makePublicConfirmTitle:
    "waves.create.groups.editAccess.makePublicConfirmTitle",
  useVisibilityConfirmTitle:
    "waves.create.groups.editAccess.useVisibilityConfirmTitle",
  makePublicConfirmMessage:
    "waves.create.groups.editAccess.makePublicConfirmMessage",
  useVisibilityConfirmMessage:
    "waves.create.groups.editAccess.useVisibilityConfirmMessage",
  useVisibilityPublicConfirmMessage:
    "waves.create.groups.editAccess.useVisibilityPublicConfirmMessage",
  confirmMakePublic: "waves.create.groups.editAccess.confirmMakePublic",
  confirmUseVisibility: "waves.create.groups.editAccess.confirmUseVisibility",
} as const;

type ConfirmationAction = typeof MAKE_PUBLIC_ACTION | "use-visibility";

function AccessShortcut({
  description,
  disabled,
  icon,
  label,
  onClick,
}: {
  readonly description: string;
  readonly disabled: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-p-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
      <p className="tw-mb-0 tw-text-sm tw-leading-5 tw-text-iron-300">
        {description}
      </p>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        className="tw-w-full sm:tw-w-auto"
        onClick={onClick}
      >
        {icon}
        {label}
      </Button>
    </div>
  );
}

export default function WaveGroupChangeDialog({
  wave,
  type,
  currentGroup,
  defaultIncludedIdentity,
  accessLabel,
  disabled = false,
  onClose,
  onGroupChange,
  onCreateGroup,
}: {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly currentGroup: ApiGroup | null;
  readonly defaultIncludedIdentity: CommunityMemberMinimal | null;
  readonly accessLabel: string;
  readonly disabled?: boolean;
  readonly onClose: () => void;
  readonly onGroupChange: (
    group: ApiGroupFull | null
  ) => void | boolean | Promise<void | boolean>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
}) {
  const locale = useBrowserLocale();
  const [confirmationAction, setConfirmationAction] =
    useState<ConfirmationAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const currentCriteria = useWaveGroupCriteria(currentGroup?.id ?? null);
  const canMatchVisibility = VISIBILITY_MATCH_TYPES.has(type);
  const visibilityGroupId = wave.visibility.scope.group?.id ?? null;
  const visibilityCriteria = useWaveGroupCriteria(
    canMatchVisibility ? visibilityGroupId : null
  );
  const groupConfigType = WAVE_GROUP_TO_CREATE_GROUP_TYPE[type];
  const groupLabel =
    CREATE_WAVE_SELECT_GROUP_LABELS[wave.wave.type][groupConfigType];
  const defaultLabel = CREATE_WAVE_NONE_GROUP_LABELS[groupConfigType];
  const suggestedName = buildInlineGroupName({
    waveName: wave.name,
    groupLabel,
    fallbackName: t(locale, "waves.create.groups.defaultGroupName"),
  });
  const criteriaMatch = useMemo(() => {
    if (
      !canMatchVisibility ||
      currentCriteria.criteria === null ||
      visibilityCriteria.criteria === null
    ) {
      return null;
    }
    return areWaveGroupCriteriaEqual(
      currentCriteria.criteria,
      visibilityCriteria.criteria
    );
  }, [
    canMatchVisibility,
    currentCriteria.criteria,
    visibilityCriteria.criteria,
  ]);
  const showMakePublic = type === WaveGroupType.VIEW && currentGroup !== null;
  const showUseVisibility = canMatchVisibility && criteriaMatch === false;
  const visibilityIsPublic = visibilityGroupId === null;
  let shortcut: ReactNode = null;
  if (showMakePublic) {
    shortcut = (
      <AccessShortcut
        description={t(locale, EDIT_ACCESS_MESSAGES.makePublicDescription)}
        disabled={disabled}
        icon={<GlobeAltIcon aria-hidden="true" className="tw-size-4" />}
        label={t(locale, EDIT_ACCESS_MESSAGES.makePublic)}
        onClick={() => setConfirmationAction(MAKE_PUBLIC_ACTION)}
      />
    );
  } else if (showUseVisibility) {
    const descriptionKey = visibilityIsPublic
      ? EDIT_ACCESS_MESSAGES.useVisibilityPublicDescription
      : EDIT_ACCESS_MESSAGES.useVisibilityDescription;
    shortcut = (
      <AccessShortcut
        description={t(locale, descriptionKey, { groupLabel: accessLabel })}
        disabled={disabled}
        icon={<ArrowPathIcon aria-hidden="true" className="tw-size-4" />}
        label={t(locale, EDIT_ACCESS_MESSAGES.useVisibility)}
        onClick={() => setConfirmationAction("use-visibility")}
      />
    );
  }

  const confirmShortcut = async () => {
    if (confirmationAction === null || disabled || isConfirming) {
      return;
    }
    setIsConfirming(true);
    try {
      const nextGroup =
        confirmationAction === MAKE_PUBLIC_ACTION
          ? null
          : (visibilityCriteria.criteria?.group ?? null);
      await onGroupChange(nextGroup);
    } finally {
      setIsConfirming(false);
      setConfirmationAction(null);
    }
  };
  const confirmationIsPublic =
    confirmationAction === MAKE_PUBLIC_ACTION || visibilityIsPublic;
  const confirmationTitleKey =
    confirmationAction === MAKE_PUBLIC_ACTION
      ? EDIT_ACCESS_MESSAGES.makePublicConfirmTitle
      : EDIT_ACCESS_MESSAGES.useVisibilityConfirmTitle;
  let confirmationMessageKey: MessageKey =
    EDIT_ACCESS_MESSAGES.useVisibilityConfirmMessage;
  if (confirmationAction === MAKE_PUBLIC_ACTION) {
    confirmationMessageKey = EDIT_ACCESS_MESSAGES.makePublicConfirmMessage;
  } else if (confirmationIsPublic) {
    confirmationMessageKey =
      EDIT_ACCESS_MESSAGES.useVisibilityPublicConfirmMessage;
  }
  const confirmationConfirmTextKey = confirmationIsPublic
    ? EDIT_ACCESS_MESSAGES.confirmMakePublic
    : EDIT_ACCESS_MESSAGES.confirmUseVisibility;

  return (
    <>
      <GroupAssignmentDialog
        title={t(locale, EDIT_ACCESS_MESSAGES.title, {
          groupLabel: accessLabel,
        })}
        description={t(locale, EDIT_ACCESS_MESSAGES.description, {
          groupLabel: accessLabel,
        })}
        suggestedName={suggestedName}
        defaultLabel={defaultLabel}
        selectedGroup={currentCriteria.criteria?.group ?? null}
        selectedGroupIncludedWallets={currentCriteria.criteria?.includedWallets}
        selectedGroupExcludedWallets={currentCriteria.criteria?.excludedWallets}
        defaultIncludedIdentity={defaultIncludedIdentity}
        membersRoleLabel={groupLabel}
        allowGroupClear={false}
        disabled={disabled}
        startMode="criteria"
        beforePanel={shortcut}
        isContentLoading={currentCriteria.isLoading}
        contentError={currentCriteria.isError}
        paused={confirmationAction !== null}
        onRetry={currentCriteria.retry}
        onClose={onClose}
        onChange={onGroupChange}
        onCreateGroup={onCreateGroup}
      />
      <MobileWrapperConfirmationDialog
        isOpen={confirmationAction !== null}
        title={t(locale, confirmationTitleKey)}
        message={t(locale, confirmationMessageKey, {
          groupLabel: accessLabel,
        })}
        confirmText={t(locale, confirmationConfirmTextKey)}
        cancelText={t(locale, "waves.create.actions.cancel")}
        confirmVariant="destructive"
        isConfirming={isConfirming}
        confirmDisabled={disabled}
        onClose={() => setConfirmationAction(null)}
        onConfirm={() => {
          void confirmShortcut();
        }}
      />
    </>
  );
}
