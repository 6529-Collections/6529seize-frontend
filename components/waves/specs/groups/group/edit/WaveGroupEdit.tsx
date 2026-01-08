import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import SelectGroupModalWrapper from "@/components/utils/select-group/SelectGroupModalWrapper";
import type { WaveGroupType } from "../WaveGroup.types";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { buildWaveUpdateBody } from "./buttons/utils/waveGroupEdit";

export default function WaveGroupEdit({
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
    opts?: { readonly skipAuth?: boolean | undefined },
  ) => Promise<void>;
}) {
  const getBody = ({
    group,
  }: {
    readonly group: ApiGroupFull;
  }): ApiUpdateWaveRequest => {
    return buildWaveUpdateBody(wave, type, group.id);
  };

  const onGroupSelect = async (group: ApiGroupFull): Promise<void> => {
    const body = getBody({ group });
    await onWaveUpdate(body);
    setIsEditOpen(false);
  };

  return (
    <SelectGroupModalWrapper
      isOpen={isEditOpen}
      onClose={() => setIsEditOpen(false)}
      onGroupSelect={onGroupSelect}
    />
  );
}
