import { WaveParticipationRequirement } from "../../../../generated/models/WaveParticipationRequirement";
import { WaveType } from "../../../../generated/models/WaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import {
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
} from "../../../../types/waves.types";
import CreateWaveDropsMetadata from "./metadata/CreateWaveDropsMetadata";
import CreateWaveDropsTypes from "./types/CreateWaveDropsTypes";

export default function CreateWaveDrops({
  waveType,
  drops,
  errors,
  setDrops,
}: {
  readonly waveType: WaveType;
  readonly drops: CreateWaveDropsConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDrops: (drops: CreateWaveDropsConfig) => void;
}) {
  const onAllowDiscussionDropsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDrops({
      ...drops,
      allowDiscussionDrops: e.target.checked,
    });
  };

  const onNoOfApplicationsAllowedPerParticipantChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const noOfApplicationsAllowedPerParticipant = parseInt(e.target.value);
    const isValid =
      !isNaN(noOfApplicationsAllowedPerParticipant) &&
      noOfApplicationsAllowedPerParticipant > 0;
    setDrops({
      ...drops,
      noOfApplicationsAllowedPerParticipant: isValid
        ? noOfApplicationsAllowedPerParticipant
        : null,
    });
  };

  const onRequiredTypeChange = (type: WaveParticipationRequirement) => {
    const requiredTypes = drops.requiredTypes.includes(type) ? [] : [type];

    setDrops({
      ...drops,
      requiredTypes,
    });
  };

  const onRequiredMetadataChange = (
    requiredMetadata: CreateWaveDropsRequiredMetadata[]
  ) => {
    setDrops({
      ...drops,
      requiredMetadata,
    });
  };

  const isNotChatType = waveType !== WaveType.Chat;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      {isNotChatType && (
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <div className="tw-flex tw-h-6 tw-items-center">
            <input
              checked={drops.allowDiscussionDrops}
              onChange={onAllowDiscussionDropsChange}
              type="checkbox"
              id="allow-discussion-drops"
              className="tw-form-checkbox tw-w-5 tw-h-5 tw-rounded focus:tw-ring-primary-400 tw-ring-offset-gray-700 focus:tw-ring-offset-gray-700 focus:tw-ring-2 tw-bg-iron-800 tw-border-iron-650 tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
          <label
            htmlFor="allow-discussion-drops"
            className="tw-cursor-pointer tw-text-sm tw-font-medium tw-text-iron-300"
          >
            Allow discussion drops
          </label>
        </div>
      )}
      {isNotChatType && (
        <div className="tw-group tw-w-full tw-relative">
          <input
            type="text"
            value={
              drops.noOfApplicationsAllowedPerParticipant !== null
                ? drops.noOfApplicationsAllowedPerParticipant.toString()
                : ""
            }
            onChange={onNoOfApplicationsAllowedPerParticipantChange}
            id="no-of-applications-allowed-per-participant"
            autoComplete="off"
            className={`${
              drops.noOfApplicationsAllowedPerParticipant
                ? "focus:tw-text-white tw-text-primary-400"
                : "tw-text-white"
            } tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400  tw-form-input tw-block tw-px-4 tw-py-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-border-iron-600 tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
            placeholder=" "
          />
          <label
            htmlFor="no-of-applications-allowed-per-participant"
            className="peer-focus:tw-text-primary-400 tw-text-iron-500  tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2  peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            Number of applications allowed per participant (optional)
          </label>
        </div>
      )}
      <CreateWaveDropsTypes
        requiredTypes={drops.requiredTypes}
        onRequiredTypeChange={onRequiredTypeChange}
      />
      <CreateWaveDropsMetadata
        requiredMetadata={drops.requiredMetadata}
        errors={errors}
        onRequiredMetadataChange={onRequiredMetadataChange}
      />
    </div>
  );
}
