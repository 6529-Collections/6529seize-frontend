"use client";

import type { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type {
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
} from "@/types/waves.types";
import CreateWaveDropsMetadata from "./metadata/CreateWaveDropsMetadata";
import CreateWaveDropsSubmissionMode from "./submission-mode/CreateWaveDropsSubmissionMode";
import CreateWaveDropsTypes from "./types/CreateWaveDropsTypes";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

const ADVANCED_DROPS_ERRORS = new Set<CREATE_WAVE_VALIDATION_ERROR>([
  CREATE_WAVE_VALIDATION_ERROR.APPLICATIONS_PER_PARTICIPANT_MUST_BE_POSITIVE,
  CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE,
  CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY,
  CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_APPLICATIONS_PER_PARTICIPANT,
  CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_TYPES,
  CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_REQUIRED_METADATA,
]);

export default function CreateWaveDrops({
  waveType,
  drops,
  errors,
  ongoingRanking = false,
  setDrops,
}: {
  readonly waveType: ApiWaveType;
  readonly drops: CreateWaveDropsConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly ongoingRanking?: boolean;
  readonly setDrops: (drops: CreateWaveDropsConfig) => void;
}) {
  const locale = useBrowserLocale();
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

  const onSubmissionStrategyChange = (
    submissionStrategy: CreateWaveDropsConfig["submissionStrategy"]
  ) => {
    setDrops({
      ...drops,
      submissionStrategy,
    });
  };

  const isNotChatType = waveType !== ApiWaveType.Chat;
  const isCustomized =
    drops.requiredTypes.length > 0 ||
    drops.requiredMetadata.length > 0 ||
    drops.noOfApplicationsAllowedPerParticipant !== null;
  const hasAdvancedError = errors.some((error) =>
    ADVANCED_DROPS_ERRORS.has(error)
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <CreateWaveStepHeader
        title={t(locale, "waves.create.drops.title")}
        description={t(locale, "waves.create.drops.description")}
      />
      {isNotChatType && (
        <CreateWaveDropsSubmissionMode
          submissionStrategy={drops.submissionStrategy}
          errors={errors}
          isOngoingRanking={waveType === ApiWaveType.Rank && ongoingRanking}
          onChange={onSubmissionStrategyChange}
        />
      )}
      <CreateWaveAdvancedSection
        title={t(locale, "waves.create.drops.requirementsTitle")}
        isCustomized={isCustomized}
        hasError={hasAdvancedError}
        variant="filled"
      >
        <div className="tw-flex tw-flex-col tw-gap-y-6 tw-p-5">
          <CreateWaveDropsTypes
            requiredTypes={drops.requiredTypes}
            onRequiredTypeChange={onRequiredTypeChange}
          />
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-6">
            <CreateWaveDropsMetadata
              requiredMetadata={drops.requiredMetadata}
              errors={errors}
              onRequiredMetadataChange={onRequiredMetadataChange}
            />
          </div>
          {isNotChatType && (
            <div className="tw-flex tw-flex-col tw-gap-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-6">
              <div className="tw-group tw-relative tw-w-full">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={
                    drops.noOfApplicationsAllowedPerParticipant !== null
                      ? drops.noOfApplicationsAllowedPerParticipant.toString()
                      : ""
                  }
                  onChange={onNoOfApplicationsAllowedPerParticipantChange}
                  id="no-of-applications-allowed-per-participant"
                  autoComplete="off"
                  className={`${
                    drops.noOfApplicationsAllowedPerParticipant !== null &&
                    drops.noOfApplicationsAllowedPerParticipant !== 0
                      ? "tw-text-primary-400 focus:tw-text-white"
                      : "tw-text-white"
                  } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-white/10 tw-bg-iron-950 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 sm:tw-text-sm`}
                  placeholder=" "
                />
                <label
                  htmlFor="no-of-applications-allowed-per-participant"
                  className="tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-max-w-[calc(100%-1rem)] tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-truncate tw-whitespace-nowrap tw-bg-iron-950 tw-px-2 tw-text-sm tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-950 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
                >
                  {t(
                    locale,
                    "waves.create.drops.maxSimultaneousSubmissions.label"
                  )}
                </label>
              </div>
              <p className={CREATE_WAVE_FORM_STYLES.compactSupportingText}>
                {t(
                  locale,
                  "waves.create.drops.maxSimultaneousSubmissions.description"
                )}
              </p>
            </div>
          )}
        </div>
      </CreateWaveAdvancedSection>
    </div>
  );
}
