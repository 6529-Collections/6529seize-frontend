"use client";

import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import {
  CREATE_WAVE_GROUPS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CreateWaveGroupConfigType } from "@/types/waves.types";
import type { WaveGroupsConfig } from "@/types/waves.types";
import CreateWaveGroup from "./CreateWaveGroup";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";
import {
  ApiWaveGroupRole,
  type ApiWaveGroupRole as ApiWaveGroupRoleType,
} from "@/generated/models/ApiWaveGroupRole";

const ROLE_BY_GROUP_TYPE: Partial<
  Record<CreateWaveGroupConfigType, ApiWaveGroupRoleType>
> = {
  [CreateWaveGroupConfigType.CAN_DROP]: ApiWaveGroupRole.Participation,
  [CreateWaveGroupConfigType.CAN_VOTE]: ApiWaveGroupRole.Voting,
  [CreateWaveGroupConfigType.CAN_CHAT]: ApiWaveGroupRole.Chat,
  [CreateWaveGroupConfigType.ADMIN]: ApiWaveGroupRole.Admin,
};

const MATCHABLE_GROUP_KEY_BY_TYPE: Partial<
  Record<CreateWaveGroupConfigType, "canChat" | "canDrop" | "canVote">
> = {
  [CreateWaveGroupConfigType.CAN_CHAT]: "canChat",
  [CreateWaveGroupConfigType.CAN_DROP]: "canDrop",
  [CreateWaveGroupConfigType.CAN_VOTE]: "canVote",
};

export default function CreateWaveGroups({
  waveName,
  waveType,
  groups,
  onGroupSelect,
  onGroupMatchView,
  onCriteriaReplacementChange,
  onGroupResolutionChange,
  onInlineGroupCreate,
  chatEnabled,
  adminCanDeleteDrops,
  groupsCache,
  invalidRoles,
  isValidating,
  validationUnavailable,
  setChatEnabled,
  setDropsAdminCanDelete,
}: {
  readonly waveName: string;
  readonly waveType: ApiWaveType;
  readonly groups: WaveGroupsConfig;
  readonly onGroupSelect: (param: {
    group: ApiGroupFull | null;
    groupType: CreateWaveGroupConfigType;
    syncPrivilegeGroups?: boolean;
    syncMatchingViewGroups?: boolean;
  }) => void;
  readonly onGroupMatchView: (groupType: CreateWaveGroupConfigType) => void;
  readonly onCriteriaReplacementChange: (
    groupType: CreateWaveGroupConfigType,
    active: boolean
  ) => void;
  readonly onGroupResolutionChange: (
    groupType: CreateWaveGroupConfigType,
    active: boolean
  ) => void;
  readonly onInlineGroupCreate: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly chatEnabled: boolean;
  readonly adminCanDeleteDrops: boolean;
  readonly groupsCache: Record<string, ApiGroupFull>;
  readonly invalidRoles: readonly ApiWaveGroupRoleType[];
  readonly isValidating: boolean;
  readonly validationUnavailable: boolean;
  readonly setChatEnabled: (enabled: boolean) => void;
  readonly setDropsAdminCanDelete: (adminCanDeleteDrops: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const groupTypes = CREATE_WAVE_GROUPS[waveType];
  const customizableGroupTypes = groupTypes.filter(
    (groupType) => groupType !== CreateWaveGroupConfigType.CAN_VIEW
  );
  const hasCustomPermissions =
    groups.admin !== null ||
    groups.canChat !== groups.canView ||
    (waveType !== ApiWaveType.Chat &&
      (groups.canDrop !== groups.canView ||
        groups.canVote !== groups.canView ||
        !chatEnabled)) ||
    !adminCanDeleteDrops;

  function getErrorMessage(
    groupType: CreateWaveGroupConfigType
  ): string | null {
    const role = ROLE_BY_GROUP_TYPE[groupType];
    if (role === undefined || !invalidRoles.includes(role)) {
      return null;
    }
    return t(locale, "waves.create.groups.validation.outsideView", {
      groupName: CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType],
      viewGroupName: t(locale, "waves.create.groups.viewGroupName"),
    });
  }

  const hasCustomPermissionsError = customizableGroupTypes.some(
    (groupType) => getErrorMessage(groupType) !== null
  );
  const differsFromViewGroup = (groupType: CreateWaveGroupConfigType) => {
    const groupKey = MATCHABLE_GROUP_KEY_BY_TYPE[groupType];
    return groupKey !== undefined && groups[groupKey] !== groups.canView;
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div className="tw-space-y-2">
        <CreateWaveStepHeader
          title={t(locale, "waves.create.groups.title")}
          description={t(locale, "waves.create.groups.description")}
        />
        <p
          className={`${CREATE_WAVE_FORM_STYLES.compactSupportingText} tw-max-w-2xl tw-text-pretty !tw-text-iron-500`}
        >
          {t(locale, "waves.create.groups.accessHelper")}
        </p>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {isValidating && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-400">
            {t(locale, "waves.create.groups.validation.checking")}
          </p>
        )}
        {validationUnavailable && (
          <p className="tw-m-0 tw-text-sm tw-text-error" role="alert">
            {t(locale, "waves.create.groups.validation.unavailable")}
          </p>
        )}
      </div>
      <CreateWaveGroup
        waveName={waveName}
        groupType={CreateWaveGroupConfigType.CAN_VIEW}
        waveType={waveType}
        chatEnabled={chatEnabled}
        groupsCache={groupsCache}
        groups={groups}
        adminCanDeleteDrops={adminCanDeleteDrops}
        setChatEnabled={setChatEnabled}
        onGroupSelect={(group) =>
          onGroupSelect({
            group,
            groupType: CreateWaveGroupConfigType.CAN_VIEW,
          })
        }
        onCriteriaReplacementChange={(active) =>
          onCriteriaReplacementChange(
            CreateWaveGroupConfigType.CAN_VIEW,
            active
          )
        }
        onGroupResolutionChange={(active) =>
          onGroupResolutionChange(CreateWaveGroupConfigType.CAN_VIEW, active)
        }
        onInlineGroupCreate={onInlineGroupCreate}
        onMakeWavePublic={() =>
          onGroupSelect({
            group: null,
            groupType: CreateWaveGroupConfigType.CAN_VIEW,
            syncPrivilegeGroups: false,
            syncMatchingViewGroups: true,
          })
        }
        setDropsAdminCanDelete={setDropsAdminCanDelete}
        errorMessage={getErrorMessage(CreateWaveGroupConfigType.CAN_VIEW)}
      />
      <CreateWaveAdvancedSection
        title={t(locale, "waves.create.groups.customizePermissions")}
        isCustomized={hasCustomPermissions}
        hasError={hasCustomPermissionsError}
        defaultOpen={hasCustomPermissions}
        variant="filled"
      >
        <div className="tw-flex tw-flex-col tw-gap-y-6 tw-p-4">
          {customizableGroupTypes.map((groupType) => (
            <CreateWaveGroup
              key={groupType}
              waveName={waveName}
              groupType={groupType}
              waveType={waveType}
              chatEnabled={chatEnabled}
              groupsCache={groupsCache}
              groups={groups}
              adminCanDeleteDrops={adminCanDeleteDrops}
              setChatEnabled={setChatEnabled}
              onGroupSelect={(group) => onGroupSelect({ group, groupType })}
              onCriteriaReplacementChange={(active) =>
                onCriteriaReplacementChange(groupType, active)
              }
              onGroupResolutionChange={(active) =>
                onGroupResolutionChange(groupType, active)
              }
              onInlineGroupCreate={onInlineGroupCreate}
              showMatchWaveAccess={differsFromViewGroup(groupType)}
              onMatchWaveAccess={() => onGroupMatchView(groupType)}
              setDropsAdminCanDelete={setDropsAdminCanDelete}
              errorMessage={getErrorMessage(groupType)}
            />
          ))}
        </div>
      </CreateWaveAdvancedSection>
    </div>
  );
}
