import { ApiWaveGroupRole } from "@/generated/models/ApiWaveGroupRole";
import { WaveGroupType } from "../../../WaveGroup.types";

const VALIDATION_ROLE_BY_GROUP_TYPE: Partial<
  Record<WaveGroupType, ApiWaveGroupRole>
> = {
  [WaveGroupType.DROP]: ApiWaveGroupRole.Participation,
  [WaveGroupType.VOTE]: ApiWaveGroupRole.Voting,
  [WaveGroupType.CHAT]: ApiWaveGroupRole.Chat,
  [WaveGroupType.ADMIN]: ApiWaveGroupRole.Admin,
};

export const getValidationRoles = (
  type: WaveGroupType
): readonly ApiWaveGroupRole[] | undefined => {
  if (type === WaveGroupType.VIEW) {
    return undefined;
  }
  const role = VALIDATION_ROLE_BY_GROUP_TYPE[type];
  // Validate every active role if a future group type is not mapped yet.
  return role !== undefined ? [role] : undefined;
};
