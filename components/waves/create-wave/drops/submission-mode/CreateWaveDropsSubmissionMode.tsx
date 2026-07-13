import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import {
  WAVE_IDENTITY_DUPLICATES_COPY,
  WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY,
} from "@/helpers/waves/wave-submission-strategy.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

enum CreateWaveSubmissionMode {
  STANDARD = "STANDARD",
  IDENTITY = "IDENTITY",
}

const createDefaultIdentitySubmissionStrategy =
  (): ApiWaveParticipationSubmissionStrategy => ({
    type: ApiWaveParticipationSubmissionStrategyType.Identity,
    config: {
      duplicates:
        ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow,
      who_can_be_submitted:
        ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone,
    },
  });

type SubmissionOptionSection = "who-can-be-submitted" | "duplicate-submissions";
type SubmissionModeOptionSection = "submission-mode";

type SubmissionOptionRowProps<T extends string> = {
  readonly type: T;
  readonly selected: T;
  readonly label: string;
  readonly description?: string;
  readonly titleId: string;
  readonly descriptionId?: string;
  readonly groupName: string;
  readonly onChange: (type: T) => void;
};

const getOptionDescriptionId = (
  section: SubmissionOptionSection | SubmissionModeOptionSection,
  option: string
) => `${section}-${option.toLowerCase()}-description`;

const getOptionTitleId = (
  section: SubmissionOptionSection | SubmissionModeOptionSection,
  option: string
) => `${section}-${option.toLowerCase()}-title`;

function SubmissionOptionRow<T extends string>({
  type,
  selected,
  label,
  description,
  titleId,
  descriptionId,
  groupName,
  onChange,
}: SubmissionOptionRowProps<T>) {
  const isSelected = selected === type;
  const wrapperClasses = isSelected
    ? "tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-500/30"
    : "tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-ring-white/10";
  const labelClasses = isSelected
    ? "tw-text-white"
    : "tw-text-iron-300 group-hover:tw-text-white";
  const descriptionClasses = isSelected
    ? "tw-text-iron-300"
    : "tw-text-iron-500";
  const hasDescription = description !== undefined;

  return (
    <label
      className={`${wrapperClasses} tw-group tw-flex tw-w-full tw-cursor-pointer tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-3 tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
        hasDescription ? "tw-items-start" : "tw-items-center"
      }`}
    >
      <input
        type="radio"
        name={groupName}
        checked={isSelected}
        onChange={() => onChange(type)}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="tw-peer tw-sr-only"
      />
      <span
        aria-hidden="true"
        className={`tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
          isSelected
            ? "tw-border-primary-400 tw-bg-primary-500/10"
            : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
        } ${hasDescription ? "tw-mt-1" : ""}`}
      >
        <span
          className={`tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
            isSelected ? "tw-scale-100" : "tw-scale-0"
          }`}
        />
      </span>
      <div className="tw-flex tw-min-w-0 tw-flex-col">
        <span
          id={titleId}
          className={`${labelClasses} tw-min-h-4 tw-text-sm tw-font-semibold`}
        >
          {label}
        </span>
        {description && (
          <span
            id={descriptionId}
            className={`${descriptionClasses} tw-mt-1 tw-text-xs tw-font-medium tw-leading-4`}
          >
            {description}
          </span>
        )}
      </div>
    </label>
  );
}

export default function CreateWaveDropsSubmissionMode({
  submissionStrategy,
  errors,
  isOngoingRanking = false,
  onChange,
}: {
  readonly submissionStrategy: ApiWaveParticipationSubmissionStrategy | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly isOngoingRanking?: boolean;
  readonly onChange: (
    submissionStrategy: ApiWaveParticipationSubmissionStrategy | null
  ) => void;
}) {
  const selectedMode =
    submissionStrategy === null
      ? CreateWaveSubmissionMode.STANDARD
      : CreateWaveSubmissionMode.IDENTITY;

  const showSubmissionStrategyError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.DROPS_SUBMISSION_STRATEGY_INVALID
  );
  const showDuplicatesRequireWinnersError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.IDENTITY_DUPLICATES_REQUIRE_WINNERS
  );

  // A perpetual rank wave never announces winners, so a "resubmit after it
  // wins" rule could never unlock; hide it from the choices.
  const duplicatesOptions = (
    Object.values(
      ApiWaveParticipationIdentitySubmissionAllowDuplicates
    ) as ApiWaveParticipationIdentitySubmissionAllowDuplicates[]
  ).filter(
    (option) =>
      !isOngoingRanking ||
      option !==
        ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin
  );

  const onSubmissionModeChange = (mode: CreateWaveSubmissionMode) => {
    if (mode === CreateWaveSubmissionMode.STANDARD) {
      onChange(null);
      return;
    }

    onChange(submissionStrategy ?? createDefaultIdentitySubmissionStrategy());
  };

  const onWhoCanBeSubmittedChange = (
    whoCanBeSubmitted: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted
  ) => {
    if (!submissionStrategy) {
      return;
    }

    onChange({
      ...submissionStrategy,
      config: {
        ...submissionStrategy.config,
        who_can_be_submitted: whoCanBeSubmitted,
      },
    });
  };

  const onDuplicatesChange = (
    duplicates: ApiWaveParticipationIdentitySubmissionAllowDuplicates
  ) => {
    if (!submissionStrategy) {
      return;
    }

    onChange({
      ...submissionStrategy,
      config: {
        ...submissionStrategy.config,
        duplicates,
      },
    });
  };

  const submissionModeOptions: {
    readonly type: CreateWaveSubmissionMode;
    readonly label: string;
  }[] = [
    {
      type: CreateWaveSubmissionMode.STANDARD,
      label: "Standard drops",
    },
    {
      type: CreateWaveSubmissionMode.IDENTITY,
      label: "Identity nominations",
    },
  ];

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div>
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
          Submission type
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-text-iron-400">
          Choose whether participants submit drops or nominate identities.
        </p>
      </div>

      <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
        {submissionModeOptions.map((option) => (
          <SubmissionOptionRow
            key={option.type}
            type={option.type}
            selected={selectedMode}
            label={option.label}
            titleId={getOptionTitleId("submission-mode", option.type)}
            groupName="submission-mode"
            onChange={onSubmissionModeChange}
          />
        ))}
      </div>

      <CommonAnimationHeight>
        {submissionStrategy && (
          <div className="tw-flex tw-flex-col tw-gap-y-6">
            <div>
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
                Which identities can a participant submit?
              </p>
              <div className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3">
                {(
                  Object.values(
                    ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted
                  ) as ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted[]
                ).map((option) => {
                  const titleId = getOptionTitleId(
                    "who-can-be-submitted",
                    option
                  );
                  const descriptionId = getOptionDescriptionId(
                    "who-can-be-submitted",
                    option
                  );

                  return (
                    <SubmissionOptionRow
                      key={option}
                      type={option}
                      selected={submissionStrategy.config.who_can_be_submitted}
                      label={
                        WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY[option].label
                      }
                      description={
                        WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY[option]
                          .description
                      }
                      titleId={titleId}
                      descriptionId={descriptionId}
                      groupName="who-can-be-submitted"
                      onChange={onWhoCanBeSubmittedChange}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
                When can the same identity be submitted again?
              </p>
              <div className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3">
                {duplicatesOptions.map((option) => {
                  const titleId = getOptionTitleId(
                    "duplicate-submissions",
                    option
                  );
                  const descriptionId = getOptionDescriptionId(
                    "duplicate-submissions",
                    option
                  );

                  return (
                    <SubmissionOptionRow
                      key={option}
                      type={option}
                      selected={submissionStrategy.config.duplicates}
                      label={WAVE_IDENTITY_DUPLICATES_COPY[option].label}
                      description={
                        WAVE_IDENTITY_DUPLICATES_COPY[option].description
                      }
                      titleId={titleId}
                      descriptionId={descriptionId}
                      groupName="duplicate-submissions"
                      onChange={onDuplicatesChange}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CommonAnimationHeight>

      <CommonAnimationHeight>
        {showSubmissionStrategyError && (
          <div className="tw-text-sm tw-font-medium tw-text-error">
            Complete the identity nomination settings before continuing.
          </div>
        )}
      </CommonAnimationHeight>

      <CommonAnimationHeight>
        {showDuplicatesRequireWinnersError && (
          <div className="tw-text-sm tw-font-medium tw-text-error">
            {t(
              DEFAULT_LOCALE,
              "waves.create.drops.identityDuplicatesRequireWinners"
            )}
          </div>
        )}
      </CommonAnimationHeight>
    </div>
  );
}
