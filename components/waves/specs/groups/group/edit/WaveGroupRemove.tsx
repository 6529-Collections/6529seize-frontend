import { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { ApiWave } from "@/generated/models/ApiWave";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { convertWaveToUpdateWave } from "@/helpers/waves/waves.helpers";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import { WaveGroupType } from "../WaveGroup.types";
import WaveGroupRemoveModal from "./WaveGroupRemoveModal";

const groupTypePaths: Record<WaveGroupType, readonly string[]> = {
  [WaveGroupType.VIEW]: ["visibility", "scope", "group_id"],
  [WaveGroupType.DROP]: ["participation", "scope", "group_id"],
  [WaveGroupType.VOTE]: ["voting", "scope", "group_id"],
  [WaveGroupType.CHAT]: ["chat", "scope", "group_id"],
  [WaveGroupType.ADMIN]: ["wave", "admin_group", "group_id"],
};

const clearGroupIdAtPath = (
  body: ApiUpdateWaveRequest,
  path: readonly string[],
): ApiUpdateWaveRequest => {
  const clonedBody = { ...body } as Record<string, unknown>;
  let currentSource = body as Record<string, unknown> | undefined;
  let currentTarget = clonedBody;

  path.forEach((segment, index) => {
    if (index === path.length - 1) {
      currentTarget[segment] = null;
      return;
    }

    const nextSource = (currentSource?.[segment] ?? {}) as Record<
      string,
      unknown
    >;
    const nextTarget = { ...nextSource };

    currentTarget[segment] = nextTarget;
    currentSource = nextSource;
    currentTarget = nextTarget;
  });

  return clonedBody as ApiUpdateWaveRequest;
};

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
  readonly onWaveUpdate: (body: ApiUpdateWaveRequest) => Promise<void>;
}) {
  const getBody = (): ApiUpdateWaveRequest => {
    const originalBody = convertWaveToUpdateWave(wave);
    const path = groupTypePaths[type];

    if (!path) {
      assertUnreachable(type);
      return originalBody;
    }

    return clearGroupIdAtPath(originalBody, path);
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
