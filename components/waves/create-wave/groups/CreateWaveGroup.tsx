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
      <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <CommonBorderedRadioButton
          type={CreateWaveGroupStatus.NONE}
          selected={selected}
          label={CREATE_WAVE_NONE_GROUP_LABELS[groupType]}
          onChange={switchSelected}
        />
        <div className="tw-relative">
          <CreateWaveGroupItem
            selectedGroup={selectedGroup}
            switchSelected={switchSelected}
            onSelectedClick={onSelectedClick}
          />
          <div className="tw-absolute tw-pt-2 tw-text-yellow tw-text-xs tw-font-medium">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-text-yellow"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                If you are not in this group, you will not see this wave.
              </span>
            </div>
          </div>
        </div>

        <SelectGroupModalWrapper
          isOpen={selected === CreateWaveGroupStatus.GROUP && !selectedGroup}
          onClose={() => switchSelected(CreateWaveGroupStatus.NONE)}
          onGroupSelect={setGroup}
        />
      </div>
    </div>
  );
}
