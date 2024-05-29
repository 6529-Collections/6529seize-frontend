import { useState } from "react";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import {
  CreateWaveGroupConfigType,
  CreateWaveGroupStatus,
  WaveType,
} from "../../../../types/waves.types";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "../../../../helpers/waves/waves.constants";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import SelectGroupModal from "../../../utils/select-group/SelectGroupModal";

export default function CreateWaveGroup({
  waveType,
  groupType,
}: {
  readonly waveType: WaveType;
  readonly groupType: CreateWaveGroupConfigType;
}) {
  const [selected, setSelected] = useState<CreateWaveGroupStatus>(
    CreateWaveGroupStatus.NONE
  );
  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        {CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType]}
      </p>
      <div className="tw-mt-3 tw-grid md:tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <CommonBorderedRadioButton
          type={CreateWaveGroupStatus.NONE}
          selected={selected}
          label={CREATE_WAVE_NONE_GROUP_LABELS[groupType]}
          onChange={setSelected}
        />
        <CommonBorderedRadioButton
          type={CreateWaveGroupStatus.GROUP}
          selected={selected}
          label="A Group"
          onChange={setSelected}
        />
        <CommonAnimationWrapper mode="sync" initial={true}>
          {selected === CreateWaveGroupStatus.GROUP && (
            <CommonAnimationOpacity
              key="modal"
              elementClasses="tw-absolute tw-z-10"
              elementRole="dialog"
              onClicked={(e) => e.stopPropagation()}
            >
              <SelectGroupModal
                onClose={() => setSelected(CreateWaveGroupStatus.NONE)}
              />
            </CommonAnimationOpacity>
          )}
        </CommonAnimationWrapper>
      </div>
    </div>
  );
}
