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
import WavesGroupInputs from "../../WavesGroupInputs";

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
        {selected === CreateWaveGroupStatus.GROUP && <WavesGroupInputs />}
      </div>
    </div>
  );
}
