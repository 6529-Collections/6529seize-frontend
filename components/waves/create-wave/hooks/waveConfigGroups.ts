import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveConfig } from "@/types/waves.types";

export type PrivilegeGroupKey = "canDrop" | "canVote" | "canChat";

export const getPrivilegeGroupKeys = (
  waveType: ApiWaveType
): readonly PrivilegeGroupKey[] =>
  waveType === ApiWaveType.Chat
    ? ["canChat"]
    : ["canChat", "canDrop", "canVote"];

export const updateManualPrivilegeSelections = ({
  groups,
  manuallySelected,
  privilegeGroups,
  syncMatchingViewGroups,
  syncPrivilegeGroups,
}: {
  readonly groups: CreateWaveConfig["groups"];
  readonly manuallySelected: Set<PrivilegeGroupKey>;
  readonly privilegeGroups: readonly PrivilegeGroupKey[];
  readonly syncMatchingViewGroups: boolean;
  readonly syncPrivilegeGroups: boolean;
}) => {
  if (syncMatchingViewGroups) {
    for (const privilegeGroup of privilegeGroups) {
      if (groups[privilegeGroup] === groups.canView) {
        manuallySelected.delete(privilegeGroup);
      } else {
        manuallySelected.add(privilegeGroup);
      }
    }
    return;
  }
  if (!syncPrivilegeGroups) {
    for (const privilegeGroup of privilegeGroups) {
      manuallySelected.add(privilegeGroup);
    }
  }
};

export const getMatchingPrivilegeUpdates = ({
  groups,
  nextGroupId,
  privilegeGroups,
}: {
  readonly groups: CreateWaveConfig["groups"];
  readonly nextGroupId: string | null;
  readonly privilegeGroups: readonly PrivilegeGroupKey[];
}): Partial<CreateWaveConfig["groups"]> =>
  Object.fromEntries(
    privilegeGroups
      .filter((privilegeGroup) => groups[privilegeGroup] === groups.canView)
      .map((privilegeGroup) => [privilegeGroup, nextGroupId])
  );

export const getPrivilegeGroupDefaults = ({
  groupId,
  waveType,
  manuallySelected,
}: {
  readonly groupId: string | null;
  readonly waveType: ApiWaveType;
  readonly manuallySelected: ReadonlySet<PrivilegeGroupKey>;
}): Partial<CreateWaveConfig["groups"]> => {
  return {
    ...(!manuallySelected.has("canChat") ? { canChat: groupId } : {}),
    ...(waveType !== ApiWaveType.Chat && !manuallySelected.has("canDrop")
      ? { canDrop: groupId }
      : {}),
    ...(waveType !== ApiWaveType.Chat && !manuallySelected.has("canVote")
      ? { canVote: groupId }
      : {}),
  };
};
