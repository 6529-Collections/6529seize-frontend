import { GroupFull } from "../../../../../../../generated/models/GroupFull";
import { Wave } from "../../../../../../../generated/models/Wave";
import SelectGroupModalWrapper from "../../../../../../utils/select-group/SelectGroupModalWrapper";
import { WaveGroupType } from "../WaveGroup";
import { convertWaveToUpdateWave } from "../../../../../../../helpers/waves/waves.helpers";
import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import { UpdateWaveRequest } from "../../../../../../../generated/models/UpdateWaveRequest";

export default function WaveGroupEdit({
  wave,
  type,
  isEditOpen,
  setIsEditOpen,
  onEdit,
}: {
  readonly wave: Wave;
  readonly type: WaveGroupType;
  readonly isEditOpen: boolean;
  readonly setIsEditOpen: (isOpen: boolean) => void;
  readonly onEdit: (body: UpdateWaveRequest) => Promise<void>;
}) {
  const getBody = ({
    group,
  }: {
    readonly group: GroupFull;
  }): UpdateWaveRequest => {
    const originalBody = convertWaveToUpdateWave(wave);
    switch (type) {
      case WaveGroupType.VIEW:
        return {
          ...originalBody,
          visibility: {
            ...originalBody.visibility,
            scope: {
              ...originalBody.visibility.scope,
              group_id: group.id,
            },
          },
        };
      case WaveGroupType.DROP:
        return {
          ...originalBody,
          participation: {
            ...originalBody.participation,
            scope: {
              ...originalBody.participation.scope,
              group_id: group.id,
            },
          },
        };
      case WaveGroupType.VOTE:
        return {
          ...originalBody,
          voting: {
            ...originalBody.voting,
            scope: {
              ...originalBody.voting.scope,
              group_id: group.id,
            },
          },
        };
      case WaveGroupType.ADMIN:
        return {
          ...originalBody,
          wave: {
            ...originalBody.wave,
            admin_group: {
              ...originalBody.wave.admin_group,
              group_id: group.id,
            },
          },
        };
      default:
        assertUnreachable(type);
        return originalBody;
    }
  };

  const onGroupSelect = async (group: GroupFull): Promise<void> => {
    const body = getBody({ group });
    await onEdit(body);
  };

  return (
    <SelectGroupModalWrapper
      isOpen={isEditOpen}
      onClose={() => setIsEditOpen(false)}
      onGroupSelect={onGroupSelect}
    />
  );
}
