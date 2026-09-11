import type { ApiWaveGroupValidationRequest } from "@/generated/models/ApiWaveGroupValidationRequest";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { ApiWaveGroupRole } from "@/generated/models/ApiWaveGroupRole";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { WaveGroupsConfig } from "@/types/waves.types";

export const getWaveGroupValidationRequest = ({
  groups,
  waveType,
  chatEnabled,
  includeAuthenticatedUserAsAdmin = false,
}: {
  readonly groups: WaveGroupsConfig;
  readonly waveType: ApiWaveType;
  readonly chatEnabled: boolean;
  readonly includeAuthenticatedUserAsAdmin?: boolean | undefined;
}): ApiWaveGroupValidationRequest => ({
  visibility_group_id: groups.canView,
  ...(waveType === ApiWaveType.Chat
    ? {}
    : {
        participation_group_id: groups.canDrop,
        voting_group_id: groups.canVote,
      }),
  ...(chatEnabled ? { chat_group_id: groups.canChat } : {}),
  ...(groups.admin !== null ? { admin_group_id: groups.admin } : {}),
  ...(includeAuthenticatedUserAsAdmin && groups.admin === null
    ? { include_authenticated_user_as_admin: true }
    : {}),
});

export const getWaveUpdateGroupValidationRequest = (
  body: ApiUpdateWaveRequest,
  roles?: readonly ApiWaveGroupRole[]
): ApiWaveGroupValidationRequest => {
  const includesRole = (role: ApiWaveGroupRole): boolean =>
    roles === undefined || roles.includes(role);
  return {
    visibility_group_id: body.visibility.scope.group_id,
    ...(body.wave.type === ApiWaveType.Chat ||
    !includesRole(ApiWaveGroupRole.Participation)
      ? {}
      : {
          participation_group_id: body.participation.scope.group_id,
        }),
    ...(body.wave.type === ApiWaveType.Chat ||
    !includesRole(ApiWaveGroupRole.Voting)
      ? {}
      : { voting_group_id: body.voting.scope.group_id }),
    ...(body.chat.enabled && includesRole(ApiWaveGroupRole.Chat)
      ? { chat_group_id: body.chat.scope.group_id }
      : {}),
    ...(body.wave.admin_group && includesRole(ApiWaveGroupRole.Admin)
      ? { admin_group_id: body.wave.admin_group.group_id }
      : {}),
    ...(body.wave.admin_group === null && includesRole(ApiWaveGroupRole.Admin)
      ? { include_authenticated_user_as_admin: true }
      : {}),
  };
};
