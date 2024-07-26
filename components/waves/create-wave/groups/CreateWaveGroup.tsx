import { useState } from "react";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import {
  CreateWaveGroupConfigType,
  CreateWaveGroupStatus,
} from "../../../../types/waves.types";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "../../../../helpers/waves/waves.constants";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { WaveType } from "../../../../generated/models/WaveType";
import CreateWaveGroupItem from "./CreateWaveGroupItem";
import SelectGroupModalWrapper from "../../../utils/select-group/SelectGroupModalWrapper";

export default function CreateWaveGroup({
  waveType,
  groupType,
  onGroupSelect,
}: {
  readonly waveType: WaveType;
  readonly groupType: CreateWaveGroupConfigType;
  readonly onGroupSelect: (group: GroupFull | null) => void;
}) {
  const [selected, setSelected] = useState<CreateWaveGroupStatus>(
    CreateWaveGroupStatus.NONE
  );

  const [selectedGroup, setSelectedGroup] = useState<GroupFull | null>(null);

  const switchSelected = (selectedType: CreateWaveGroupStatus) => {
    setSelected(selectedType);
    setSelectedGroup(null);
    onGroupSelect(null);
  };

  const setGroup = (group: GroupFull) => {
    onGroupSelect(group);
    setSelectedGroup(group);
    setSelected(CreateWaveGroupStatus.GROUP);
  };

  const onSelectedClick = () => {
    setSelectedGroup(null);
  };

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-tracking-tight">
        {CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType]}
      </p>
      <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <CommonBorderedRadioButton
          type={CreateWaveGroupStatus.NONE}
          selected={selected}
          label={CREATE_WAVE_NONE_GROUP_LABELS[groupType]}
          onChange={switchSelected}
        />

        <CreateWaveGroupItem
          selectedGroup={selectedGroup}
          switchSelected={switchSelected}
          onSelectedClick={onSelectedClick}
        />

        <SelectGroupModalWrapper
          isOpen={selected === CreateWaveGroupStatus.GROUP && !selectedGroup}
          onClose={() => switchSelected(CreateWaveGroupStatus.NONE)}
          onGroupSelect={setGroup}
        />
      </div>
    </div>
  );
}
