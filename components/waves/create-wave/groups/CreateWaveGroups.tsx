import { CurationFilterResponse } from "../../../../helpers/filters/Filters.types";
import {
  CreateWaveGroupConfigType,
  WaveType,
} from "../../../../types/waves.types";
import CreateWaveGroup from "./CreateWaveGroup";

export default function CreateWaveGroups({
  waveType,
  onGroupSelect,
}: {
  readonly waveType: WaveType;
  readonly onGroupSelect: ({}: {
    group: CurationFilterResponse | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
}) {
  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        {Object.values(CreateWaveGroupConfigType).map((groupType) => (
          <CreateWaveGroup
            key={groupType}
            groupType={groupType}
            waveType={waveType}
            onGroupSelect={(group) => onGroupSelect({ group, groupType })}
          />
        ))}
      </div>
      <div className="tw-mt-6 tw-text-right">
        <button
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div>
    </div>
  );
}
