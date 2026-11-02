import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../../../WaveGroup.types";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { convertWaveToUpdateWave } from "@/helpers/waves/waves.helpers";
import {
  getGroupIdByType,
  updateGroupIdByType,
} from "../../utils/waveGroupUpdate";

export const getScopedGroup = (
  wave: ApiWave,
  type: WaveGroupType
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

const isSharedAccessPublic = (wave: ApiWave): boolean =>
  getScopedGroup(wave, WaveGroupType.VIEW) === null &&
  getScopedGroup(wave, WaveGroupType.CHAT) === null;

export const buildWaveUpdateBody = (
  wave: ApiWave,
  type: WaveGroupType,
  groupId: string | null
): ApiUpdateWaveRequest => {
  const originalBody = convertWaveToUpdateWave(wave);
  const updatedBody = updateGroupIdByType(originalBody, type, groupId);
  if (
    type !== WaveGroupType.VIEW ||
    groupId === null ||
    !isSharedAccessPublic(wave)
  ) {
    return updatedBody;
  }

  return updateGroupIdByType(updatedBody, WaveGroupType.CHAT, groupId);
};

export const getGroupIdFromUpdateBody = (
  body: ApiUpdateWaveRequest,
  type: WaveGroupType
): string | null => getGroupIdByType(body, type);
