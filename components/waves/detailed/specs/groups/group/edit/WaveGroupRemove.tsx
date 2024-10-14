import { ApiUpdateWaveRequest } from "../../../../../../../generated/models/ApiUpdateWaveRequest";
import { ApiWave } from "../../../../../../../generated/models/ApiWave";
import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import { convertWaveToUpdateWave } from "../../../../../../../helpers/waves/waves.helpers";
import CommonAnimationOpacity from "../../../../../../utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "../../../../../../utils/animation/CommonAnimationWrapper";
import { WaveGroupType } from "../WaveGroup";
import WaveGroupRemoveModal from "./WaveGroupRemoveModal";

export default function WaveGroupRemove({
  wave,
  type,
  isEditOpen,
  setIsEditOpen,
  onEdit,
}: {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly isEditOpen: boolean;
  readonly setIsEditOpen: (isOpen: boolean) => void;
  readonly onEdit: (body: ApiUpdateWaveRequest) => Promise<void>;
}) {
  const getBody = (): ApiUpdateWaveRequest => {
    const originalBody = convertWaveToUpdateWave(wave);
    switch (type) {
      case WaveGroupType.VIEW:
        return {
          ...originalBody,
          visibility: {
            ...originalBody.visibility,
            scope: {
              ...originalBody.visibility.scope,
              group_id: null,
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
              group_id: null,
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
              group_id: null,
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
              group_id: null,
            },
          },
        };
      default:
        assertUnreachable(type);
        return originalBody;
    }
  };

  const onRemove = async (): Promise<void> => {
    const body = getBody();
    await onEdit(body);
  };

  return (
    <CommonAnimationWrapper mode="sync" initial={true}>
      {isEditOpen && (
        <CommonAnimationOpacity
          key="modal"
          elementClasses="tw-absolute tw-z-50"
          elementRole="dialog"
          onClicked={(e) => e.stopPropagation()}
        >
          <WaveGroupRemoveModal
            closeModal={() => setIsEditOpen(false)}
            removeGroup={onRemove}
          />
        </CommonAnimationOpacity>
      )}
    </CommonAnimationWrapper>
  );
}
