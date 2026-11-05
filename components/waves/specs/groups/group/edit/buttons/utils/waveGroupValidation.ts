import { ApiWaveGroupRole } from "@/generated/models/ApiWaveGroupRole";
import { WaveGroupType } from "../../../WaveGroup.types";

const VALIDATION_ROLE_BY_GROUP_TYPE: Partial<
  Record<WaveGroupType, ApiWaveGroupRole>
> = {
  [WaveGroupType.CHAT]: ApiWaveGroupRole.Chat,
  [WaveGroupType.ADMIN]: ApiWaveGroupRole.Admin,
};

export const getValidationRoles = (
  type: WaveGroupType
): readonly ApiWaveGroupRole[] => {
  const role = VALIDATION_ROLE_BY_GROUP_TYPE[type];
  return role !== undefined
    ? [role]
    : [ApiWaveGroupRole.Chat, ApiWaveGroupRole.Admin];
};
