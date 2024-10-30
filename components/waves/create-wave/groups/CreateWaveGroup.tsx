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
import { ApiGroupFull } from "../../../../generated/models/ApiGroupFull";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import CreateWaveGroupItem from "./CreateWaveGroupItem";
import SelectGroupModalWrapper from "../../../utils/select-group/SelectGroupModalWrapper";

export default function CreateWaveGroup({
  waveType,
  groupType,
  onGroupSelect,
}: {
  readonly waveType: ApiWaveType;
  readonly groupType: CreateWaveGroupConfigType;
  readonly onGroupSelect: (group: ApiGroupFull | null) => void;
}) {
  const [selected, setSelected] = useState<CreateWaveGroupStatus>(
    CreateWaveGroupStatus.NONE
  );

  const [selectedGroup, setSelectedGroup] = useState<ApiGroupFull | null>(null);

  const switchSelected = (selectedType: CreateWaveGroupStatus) => {
    setSelected(selectedType);
    setSelectedGroup(null);
    onGroupSelect(null);
  };

  const setGroup = (group: ApiGroupFull) => {
    onGroupSelect(group);
    setSelectedGroup(group);
    setSelected(CreateWaveGroupStatus.GROUP);
  };

  const onSelectedClick = () => {
    setSelectedGroup(null);
  };

  return (
    <div>
      <div className="tw-flex tw-items-center">
        <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          {CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType]}
        </p>
        {false && groupType === CreateWaveGroupConfigType.CAN_CHAT && (
          <div className="tw-pl-4">
            {/* SMALL toggle, make as component smallToggle
             */}
            <label className="tw-flex tw-cursor-pointer">
              <div className="tw-flex tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
                {/* Active classes:
            tw-from-primary-300
          */}
                <div className="tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] tw-from-iron-600">
                  <input type="checkbox" className="tw-sr-only" />
                  {/* Active classes:
         
             tw-bg-primary-500 focus-focus:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2
         
          */}
                  <span
                    className="tw-p-0 tw-relative tw-flex tw-items-center tw-h-5 tw-w-9 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none tw-bg-iron-700"
                    role="switch"
                    aria-checked="false"
                  >
                    {/* Active classes: tw-translate-x-5  */}
                    <span
                      aria-hidden="true"
                      className="tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out tw-translate-x-0"
                    ></span>
                  </span>
                </div>
              </div>
            </label>
          </div>
        )}
      </div>
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
