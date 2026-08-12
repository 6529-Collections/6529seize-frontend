import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { CREATE_WAVE_GROUPS } from "@/helpers/waves/waves.constants";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CreateWaveGroupConfigType,
  WaveGroupsConfig,
} from "@/types/waves.types";
import CreateWaveWarning from "../utils/CreateWaveWarning";
import CreateWaveGroup from "./CreateWaveGroup";

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
  const isRestrictedGroup = !!groups.admin && !!groups.canView;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <p className="tw-mb-0 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-400">
        {t(DEFAULT_LOCALE, "waves.create.groups.accessHelper", {
          viewGroupName: "Who can view",
        })}
      </p>
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
          title={t(DEFAULT_LOCALE, "waves.create.groups.limitedAccessTitle")}
          description={t(
            DEFAULT_LOCALE,
            "waves.create.groups.limitedAccessDescription",
            {
              viewGroupName: "Who can view",
              adminGroupName: "Admin",
            }
          )}
        />
      )}
    </div>
  );
}
