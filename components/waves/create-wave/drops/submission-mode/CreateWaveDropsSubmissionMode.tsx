import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

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

const WHO_CAN_BE_SUBMITTED_LABELS: Record<
  ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted,
  string
> = {
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself]:
    "Only myself",
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers]:
    "Only others",
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone]: "Anyone",
};

const DUPLICATES_LABELS: Record<
  ApiWaveParticipationIdentitySubmissionAllowDuplicates,
  string
> = {
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow]:
    "Never allow",
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin]:
    "Allow after win",
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.AlwaysAllow]:
    "Always allow",
};

export default function CreateWaveDropsSubmissionMode({
  submissionStrategy,
  errors,
  onChange,
}: {
  readonly submissionStrategy: ApiWaveParticipationSubmissionStrategy | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
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

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div>
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
          Submission mode
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-text-iron-400">
          Choose whether participants submit regular drops or nominate
          identities.
        </p>
      </div>

      <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
        <CommonBorderedRadioButton
          type={CreateWaveSubmissionMode.STANDARD}
          selected={selectedMode}
          label="Standard submission"
          onChange={onSubmissionModeChange}
        />
        <CommonBorderedRadioButton
          type={CreateWaveSubmissionMode.IDENTITY}
          selected={selectedMode}
          label="Vote for identity"
          onChange={onSubmissionModeChange}
        />
      </div>

      <CommonAnimationHeight>
        {submissionStrategy && (
          <div className="tw-flex tw-flex-col tw-gap-y-6">
            <div>
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
                Who can be submitted
              </p>
              <div className="tw-mt-3 tw-grid tw-gap-4 lg:tw-grid-cols-3">
                {(
                  Object.values(
                    ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted
                  ) as ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted[]
                ).map((option) => (
                  <CommonBorderedRadioButton
                    key={option}
                    type={option}
                    selected={submissionStrategy.config.who_can_be_submitted}
                    label={WHO_CAN_BE_SUBMITTED_LABELS[option]}
                    onChange={onWhoCanBeSubmittedChange}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
                Duplicate submissions
              </p>
              <div className="tw-mt-3 tw-grid tw-gap-4 lg:tw-grid-cols-3">
                {(
                  Object.values(
                    ApiWaveParticipationIdentitySubmissionAllowDuplicates
                  ) as ApiWaveParticipationIdentitySubmissionAllowDuplicates[]
                ).map((option) => (
                  <CommonBorderedRadioButton
                    key={option}
                    type={option}
                    selected={submissionStrategy.config.duplicates}
                    label={DUPLICATES_LABELS[option]}
                    onChange={onDuplicatesChange}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </CommonAnimationHeight>

      <CommonAnimationHeight>
        {showSubmissionStrategyError && (
          <div className="tw-text-sm tw-font-medium tw-text-error">
            Complete the vote-for-identity submission settings before
            continuing.
          </div>
        )}
      </CommonAnimationHeight>
    </div>
  );
}
