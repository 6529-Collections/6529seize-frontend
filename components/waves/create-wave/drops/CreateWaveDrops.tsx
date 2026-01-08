import type { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type {
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
} from "@/types/waves.types";
import CreateWaveDropsMetadata from "./metadata/CreateWaveDropsMetadata";
import CreateWaveDropsTypes from "./types/CreateWaveDropsTypes";
import CreateWaveTermsOfService from "./terms/CreateWaveTermsOfService";

export default function CreateWaveDrops({
  waveType,
  drops,
  errors,
  setDrops,
}: {
  readonly waveType: ApiWaveType;
  readonly drops: CreateWaveDropsConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDrops: (drops: CreateWaveDropsConfig) => void;
}) {
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

  const onRequiredTypeChange = (types: ApiWaveParticipationRequirement[]) => {
    setDrops({
      ...drops,
      requiredTypes: types,
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

  const isNotChatType = waveType !== ApiWaveType.Chat;

  const onTermsChange = (terms: string | null) => {
    setDrops({
      ...drops,
      terms,
      signatureRequired: !!terms,
    });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-8">
      <CreateWaveDropsTypes
        requiredTypes={drops.requiredTypes}
        onRequiredTypeChange={onRequiredTypeChange}
      />
      <div className="tw-border-t tw-border-solid tw-border-iron-700 tw-border-x-0 tw-border-b-0 tw-pt-6">
        <CreateWaveDropsMetadata
          requiredMetadata={drops.requiredMetadata}
          errors={errors}
          onRequiredMetadataChange={onRequiredMetadataChange}
        />
      </div>
      {isNotChatType && (
        <div className="tw-border-t tw-border-solid tw-border-iron-700 tw-border-x-0 tw-border-b-0 tw-pt-6 tw-flex tw-flex-col tw-gap-y-2">
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
              Maximum number of simultaneous submissions per participant
            </label>
          </div>
          <p className="tw-text-sm tw-text-iron-400 tw-font-medium">
            Optional. Unlimited if left blank.
          </p>
        </div>
      )}
      {/* Terms of Service section */}
      {isNotChatType && (
        <div className="tw-border-t tw-border-solid tw-border-iron-700 tw-border-x-0 tw-border-b-0 tw-pt-6">
          <CreateWaveTermsOfService
            waveType={waveType}
            terms={drops.terms}
            setTerms={onTermsChange}
          />
        </div>
      )}
    </div>
  );
}
