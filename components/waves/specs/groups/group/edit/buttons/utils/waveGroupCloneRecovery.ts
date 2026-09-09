import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { hideGroup } from "@/services/groups/groupMutations";

const waveReferencesGroup = (wave: ApiWave, groupId: string): boolean =>
  [
    wave.visibility.scope.group?.id,
    wave.participation.scope.group?.id,
    wave.voting.scope.group?.id,
    wave.chat.scope.group?.id,
    wave.wave.admin_group.group?.id,
  ].includes(groupId);

export const getCloneReferenceState = async ({
  waveId,
  groupId,
}: {
  readonly waveId: string;
  readonly groupId: string;
}): Promise<"attached" | "unattached" | "unknown"> => {
  try {
    const currentWave = await commonApiFetch<ApiWave>({
      endpoint: `waves/${waveId}`,
    });
    return waveReferencesGroup(currentWave, groupId)
      ? "attached"
      : "unattached";
  } catch (error) {
    console.warn(
      "[WaveGroupEditButtons] Unable to verify cloned group attachment",
      { waveId, groupId, error }
    );
    return "unknown";
  }
};

export const hideUnattachedClone = async ({
  waveId,
  groupId,
}: {
  readonly waveId: string;
  readonly groupId: string;
}): Promise<void> => {
  try {
    await hideGroup({ id: groupId });
  } catch (error) {
    console.error(
      "[WaveGroupEditButtons] Unable to hide unattached cloned group",
      { waveId, groupId, error }
    );
  }
};
