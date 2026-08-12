"use client";

import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { CREATE_WAVE_GROUPS } from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type {
  CreateWaveGroupConfigType,
  WaveGroupsConfig,
} from "@/types/waves.types";
import CreateWaveWarning from "../utils/CreateWaveWarning";
import CreateWaveGroup from "./CreateWaveGroup";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

export default function CreateWaveGroups({
  waveName,
  waveType,
  groups,
  onGroupSelect,
  onInlineGroupCreate,
  chatEnabled,
  adminCanDeleteDrops,
  groupsCache,
  setChatEnabled,
  setDropsAdminCanDelete,
}: {
  readonly waveName: string;
  readonly waveType: ApiWaveType;
  readonly groups: WaveGroupsConfig;
  readonly onGroupSelect: (param: {
    group: ApiGroupFull | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
  readonly onInlineGroupCreate: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly chatEnabled: boolean;
  readonly adminCanDeleteDrops: boolean;
  readonly groupsCache: Record<string, ApiGroupFull>;
  readonly setChatEnabled: (enabled: boolean) => void;
  readonly setDropsAdminCanDelete: (adminCanDeleteDrops: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const isRestrictedGroup = !!groups.admin && !!groups.canView;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div className="tw-space-y-2">
        <CreateWaveStepHeader
          title={t(locale, "waves.create.groups.title")}
          description={t(locale, "waves.create.groups.description")}
        />
        <p
          className={`${CREATE_WAVE_FORM_STYLES.compactSupportingText} tw-text-pretty`}
        >
          {t(locale, "waves.create.groups.accessHelper", {
            viewGroupName: t(locale, "waves.create.groups.viewGroupName"),
          })}
        </p>
      </div>
      {CREATE_WAVE_GROUPS[waveType].map((groupType) => (
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
          onInlineGroupCreate={onInlineGroupCreate}
          setDropsAdminCanDelete={setDropsAdminCanDelete}
        />
      ))}
      {isRestrictedGroup && (
        <CreateWaveWarning
          title={t(locale, "waves.create.groups.limitedAccessTitle")}
          description={t(
            locale,
            "waves.create.groups.limitedAccessDescription",
            {
              viewGroupName: t(locale, "waves.create.groups.viewGroupName"),
              adminGroupName: t(locale, "waves.create.groups.adminGroupName"),
            }
          )}
        />
      )}
    </div>
  );
}
