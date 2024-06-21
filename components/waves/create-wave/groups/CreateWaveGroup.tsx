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
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import SelectGroupModal from "../../../utils/select-group/SelectGroupModal";
import { createPortal } from "react-dom";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { WaveType } from "../../../../generated/models/WaveType";
import CreateWaveGroupItem from "./CreateWaveGroupItem";
import SelectGroupModalWrapper from "../../../utils/select-group/SelectGroupModalWrapper";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";

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

  const randomUUID = getRandomObjectId();
  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50 tw-tracking-tight">
        {CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType]}
      </p>
      <div className="tw-mt-2 tw-grid md:tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
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
        {/* {createPortal(
          <CommonAnimationWrapper mode="sync" initial={true}>
            {selected === CreateWaveGroupStatus.GROUP && !selectedGroup && (
              <CommonAnimationOpacity
                key={randomUUID}
                elementClasses="tw-absolute tw-z-10"
                elementRole="dialog"
                onClicked={(e) => e.stopPropagation()}
              >
                <SelectGroupModal
                  onClose={() => switchSelected(CreateWaveGroupStatus.NONE)}
                  onGroupSelect={setGroup}
                />
              </CommonAnimationOpacity>
            )}
          </CommonAnimationWrapper>,
          document.body
        )} */}
      </div>
    </div>
  );
}
