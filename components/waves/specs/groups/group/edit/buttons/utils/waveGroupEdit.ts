import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../../../WaveGroup.types";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { convertWaveToUpdateWave } from "@/helpers/waves/waves.helpers";
import {
  getGroupIdByType,
  updateGroupIdByType,
} from "../../utils/waveGroupUpdate";

export const buildWaveUpdateBody = (
  wave: ApiWave,
  type: WaveGroupType,
  groupId: string | null,
): ApiUpdateWaveRequest => {
  const originalBody = convertWaveToUpdateWave(wave);
  return updateGroupIdByType(originalBody, type, groupId);
};

export const getGroupIdFromUpdateBody = (
  body: ApiUpdateWaveRequest,
  type: WaveGroupType,
): string | null => getGroupIdByType(body, type);

export const getScopedGroup = (
  wave: ApiWave,
  type: WaveGroupType,
): ApiGroup | null => {
  switch (type) {
    case WaveGroupType.VIEW:
      return wave.visibility?.scope?.group ?? null;
    case WaveGroupType.DROP:
      return wave.participation?.scope?.group ?? null;
    case WaveGroupType.VOTE:
      return wave.voting?.scope?.group ?? null;
    case WaveGroupType.CHAT:
      return wave.chat?.scope?.group ?? null;
    case WaveGroupType.ADMIN:
      return wave.wave?.admin_group?.group ?? null;
    default:
      return null;
  }
};

export const isGroupAuthor = (
  scopedGroup: ApiGroup | null,
  connectedProfile: ApiIdentity | null,
): boolean => {
  if (!scopedGroup || !connectedProfile) {
    return false;
  }

  const groupAuthorId =
    scopedGroup.author?.id !== undefined && scopedGroup.author?.id !== null
      ? String(scopedGroup.author.id)
      : null;

  const userId =
    connectedProfile.id !== undefined && connectedProfile.id !== null
      ? String(connectedProfile.id)
      : null;

  if (groupAuthorId && userId && groupAuthorId === userId) {
    return true;
  }

  const groupAuthorHandle = scopedGroup.author?.handle?.toLowerCase();
  const userHandle = connectedProfile.handle?.toLowerCase();

  if (!groupAuthorHandle || !userHandle) {
    return false;
  }

  return groupAuthorHandle === userHandle;
};
