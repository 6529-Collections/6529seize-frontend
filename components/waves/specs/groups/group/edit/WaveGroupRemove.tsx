import { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { ApiWave } from "@/generated/models/ApiWave";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import { WaveGroupType } from "../WaveGroup.types";
import { buildWaveUpdateBody } from "./buttons/utils/waveGroupEdit";
import WaveGroupRemoveModal from "./WaveGroupRemoveModal";

export default function WaveGroupRemove({
  wave,
  type,
  isEditOpen,
  setIsEditOpen,
  onWaveUpdate,
}: {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly isEditOpen: boolean;
  readonly setIsEditOpen: (isOpen: boolean) => void;
  readonly onWaveUpdate: (
    body: ApiUpdateWaveRequest,
    opts?: { readonly skipAuth?: boolean },
  ) => Promise<void>;
}) {
  const getBody = (): ApiUpdateWaveRequest => {
    return buildWaveUpdateBody(wave, type, null);
  };

  const onRemove = async (): Promise<void> => {
    const body = getBody();
    await onWaveUpdate(body);
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
