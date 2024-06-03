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
import { createPortal } from "react-dom";
import { CurationFilterResponse } from "../../../../helpers/filters/Filters.types";

export default function CreateWaveGroup({
  waveType,
  groupType,
  onGroupSelect,
}: {
  readonly waveType: WaveType;
  readonly groupType: CreateWaveGroupConfigType;
  readonly onGroupSelect: (group: CurationFilterResponse | null) => void;
}) {
  const [selected, setSelected] = useState<CreateWaveGroupStatus>(
    CreateWaveGroupStatus.NONE
  );

  const [selectedGroup, setSelectedGroup] =
    useState<CurationFilterResponse | null>(null);

  const switchSelected = (selectedType: CreateWaveGroupStatus) => {
    setSelected(selectedType);
    setSelectedGroup(null);
    onGroupSelect(null);
  };

  const setGroup = (group: CurationFilterResponse) => {
    onGroupSelect(group);
    setSelectedGroup(group);
    setSelected(CreateWaveGroupStatus.GROUP);
  };
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
          onChange={switchSelected}
        />
        <CommonBorderedRadioButton
          type={CreateWaveGroupStatus.GROUP}
          selected={selected}
          label="A Group"
          onChange={switchSelected}
        />
        {selectedGroup && (
          <div className="tw-inline-flex">
            <div>
              {selectedGroup.created_by?.handle} - {selectedGroup.name}
            </div>
            <button onClick={() => switchSelected(CreateWaveGroupStatus.NONE)}>
              Remove
            </button>
          </div>
        )}
        {createPortal(
          <CommonAnimationWrapper mode="sync" initial={true}>
            {selected === CreateWaveGroupStatus.GROUP && !selectedGroup && (
              <CommonAnimationOpacity
                key="modal"
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
        )}
      </div>
    </div>
  );
}
