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

type SubmissionOptionCopy = {
  readonly label: string;
  readonly description: string;
};

type SubmissionOptionSection = "who-can-be-submitted" | "duplicate-submissions";

type SubmissionOptionRowProps<T extends string> = {
  readonly type: T;
  readonly selected: T;
  readonly label: string;
  readonly description: string;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly groupName: string;
  readonly onChange: (type: T) => void;
};

const WHO_CAN_BE_SUBMITTED_COPY: Record<
  ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted,
  SubmissionOptionCopy
> = {
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself]: {
    label: "Own identity only",
    description: "A participant can submit only themselves.",
  },
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers]: {
    label: "Other identities only",
    description: "A participant can submit someone else, but not themselves.",
  },
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone]: {
    label: "Own or other identities",
    description: "A participant can submit themselves or someone else.",
  },
};

const DUPLICATES_COPY: Record<
  ApiWaveParticipationIdentitySubmissionAllowDuplicates,
  SubmissionOptionCopy
> = {
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow]: {
    label: "Never again",
    description:
      "The same identity can be submitted only once, even after a win.",
  },
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin]: {
    label: "After it wins",
    description:
      "The same identity can have only one active submission; it can be submitted again after that submission wins.",
  },
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.AlwaysAllow]: {
    label: "At any time",
    description:
      "The same identity can be submitted repeatedly, even if another submission is already active.",
  },
};

const getOptionDescriptionId = (
  section: SubmissionOptionSection,
  option: string
) => `${section}-${option.toLowerCase()}-description`;

const getOptionTitleId = (section: SubmissionOptionSection, option: string) =>
  `${section}-${option.toLowerCase()}-title`;

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
    ? "tw-ring-primary-400 tw-bg-[#202B45] tw-shadow-xl"
    : "tw-ring-iron-700 tw-bg-iron-800 tw-shadow hover:tw-ring-iron-650";
  const inputClasses = isSelected
    ? "tw-text-primary-500 focus:tw-ring-primary-500"
    : "tw-text-primary-400 focus:tw-ring-primary-400";
  const labelClasses = isSelected
    ? "tw-text-primary-400"
    : "tw-text-iron-300 group-hover:tw-text-iron-200";
  const descriptionClasses = isSelected
    ? "tw-text-iron-200"
    : "tw-text-iron-400";

  return (
    <label
      className={`${wrapperClasses} tw-group tw-flex tw-w-full tw-cursor-pointer tw-gap-x-4 tw-rounded-lg tw-px-4 tw-py-4 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
    >
      <input
        type="radio"
        name={groupName}
        checked={isSelected}
        onChange={() => onChange(type)}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`${inputClasses} tw-form-radio tw-mt-1 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-cursor-pointer tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-800 tw-ring-offset-iron-800 tw-transition tw-duration-300 tw-ease-out focus:tw-ring-2 sm:tw-h-5 sm:tw-w-5`}
      />
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-y-2">
        <span
          id={titleId}
          className={`${labelClasses} tw-text-base tw-font-semibold`}
        >
          {label}
        </span>
        <span
          id={descriptionId}
          className={`${descriptionClasses} tw-text-sm tw-font-medium tw-leading-6`}
        >
          {description}
        </span>
      </div>
    </label>
  );
}

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
          Submission type
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-text-iron-400">
          Choose whether participants submit drops or nominate identities.
        </p>
      </div>

      <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
        <CommonBorderedRadioButton
          type={CreateWaveSubmissionMode.STANDARD}
          selected={selectedMode}
          label="Standard drops"
          onChange={onSubmissionModeChange}
        />
        <CommonBorderedRadioButton
          type={CreateWaveSubmissionMode.IDENTITY}
          selected={selectedMode}
          label="Identity nominations"
          onChange={onSubmissionModeChange}
        />
      </div>

      <CommonAnimationHeight>
        {submissionStrategy && (
          <div className="tw-flex tw-flex-col tw-gap-y-6">
            <div>
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
                Which identities can a participant submit?
              </p>
              <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-4">
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
                      label={WHO_CAN_BE_SUBMITTED_COPY[option].label}
                      description={
                        WHO_CAN_BE_SUBMITTED_COPY[option].description
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
              <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-4">
                {(
                  Object.values(
                    ApiWaveParticipationIdentitySubmissionAllowDuplicates
                  ) as ApiWaveParticipationIdentitySubmissionAllowDuplicates[]
                ).map((option) => {
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
                      label={DUPLICATES_COPY[option].label}
                      description={DUPLICATES_COPY[option].description}
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
    </div>
  );
}
