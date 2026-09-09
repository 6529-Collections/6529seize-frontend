import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import CreateWaveAdvancedSection from "@/components/waves/create-wave/utils/CreateWaveAdvancedSection";
import { CREATE_WAVE_FORM_STYLES } from "@/components/waves/create-wave/utils/createWaveFormStyles";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import {
  DEFAULT_PROPOSAL_CARD_RECIPE,
  PROPOSAL_CARD_EXCERPT_MAX_LENGTH,
  PROPOSAL_CARD_EXCERPT_MIN_LENGTH,
} from "@/helpers/waves/proposal-card.helpers";
import {
  APPROVE_WAVE_TAB_LABEL_MAX_LENGTH,
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH,
  getDefaultWaveSubmissionButtonLabel,
} from "@/helpers/waves/wave-metadata.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CreateWaveApproveDisplayConfig,
  CreateWaveDisplayConfig,
  CreateWaveProposalCardMode,
} from "@/types/waves.types";
import type { ChangeEvent } from "react";

const getApproveErrorMessage = (
  errors: readonly CREATE_WAVE_VALIDATION_ERROR[],
  locale: SupportedLocale
): string | null => {
  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_TOO_LONG
    )
  ) {
    return t(locale, "waves.proposalCard.tabLabels.errorTooLong", {
      max: APPROVE_WAVE_TAB_LABEL_MAX_LENGTH,
    });
  }

  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE
    )
  ) {
    return t(locale, "waves.proposalCard.tabLabels.errorDuplicate");
  }

  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED
    )
  ) {
    return t(locale, "waves.proposalCard.tabLabels.errorReserved");
  }

  return null;
};

function ProposalCardAppearancePreview({
  mode,
}: {
  readonly mode: CreateWaveProposalCardMode;
}) {
  return (
    <div
      aria-hidden="true"
      className="tw-mb-2 tw-h-16 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-2 sm:tw-mb-3 sm:tw-h-24 sm:tw-p-3"
    >
      {mode === "standard" ? (
        <div className="tw-flex tw-h-full tw-flex-col tw-justify-center">
          <div className="tw-flex tw-items-center tw-gap-1.5 sm:tw-gap-2">
            <span className="tw-size-3 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-650 sm:tw-size-4" />
            <span className="tw-h-1 tw-w-10 tw-rounded-full tw-bg-iron-650 sm:tw-h-1.5 sm:tw-w-16" />
          </div>
          <div className="tw-mt-1.5 tw-space-y-1 sm:tw-mt-2 sm:tw-space-y-1.5">
            <span className="tw-block tw-h-1 tw-w-full tw-rounded-full tw-bg-iron-800 sm:tw-h-1.5" />
            <span className="tw-block tw-h-1 tw-w-11/12 tw-rounded-full tw-bg-iron-800 sm:tw-h-1.5" />
            <span className="tw-block tw-h-1 tw-w-full tw-rounded-full tw-bg-iron-800 sm:tw-h-1.5" />
            <span className="tw-block tw-h-1 tw-w-3/4 tw-rounded-full tw-bg-iron-800 sm:tw-h-1.5" />
            <span className="tw-block tw-h-1 tw-w-5/6 tw-rounded-full tw-bg-iron-800 sm:tw-h-1.5" />
          </div>
        </div>
      ) : (
        <div className="tw-flex tw-h-full tw-items-center tw-gap-2 sm:tw-gap-3">
          <div className="tw-min-w-0 tw-flex-1">
            <span className="tw-block tw-h-1.5 tw-w-2/3 tw-rounded-full tw-bg-iron-650 sm:tw-h-2" />
            <span className="tw-mt-1.5 tw-block tw-h-1 tw-w-4/5 tw-rounded-full tw-bg-iron-800 sm:tw-mt-2 sm:tw-h-1.5" />
          </div>
          <span className="tw-size-8 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800 sm:tw-size-11 sm:tw-rounded-lg" />
        </div>
      )}
    </div>
  );
}

export default function CreateWaveDisplaySettings({
  display,
  errors,
  onChange,
  waveType,
}: {
  readonly display: CreateWaveDisplayConfig;
  readonly errors: readonly CREATE_WAVE_VALIDATION_ERROR[];
  readonly onChange: (display: CreateWaveDisplayConfig) => void;
  readonly waveType: ApiWaveType;
}) {
  const locale = useBrowserLocale();
  const showApproveTabLabels = waveType === ApiWaveType.Approve;
  const hasSubmissionLabelError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_BUTTON_LABEL_TOO_LONG
  );
  const hasProposalCardExcerptError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.PROPOSAL_CARD_EXCERPT_LENGTH_INVALID
  );
  const approveErrorMessage = getApproveErrorMessage(errors, locale);
  const submissionLabelErrorMessage = hasSubmissionLabelError
    ? t(locale, "waves.submissionButtonLabel.errorTooLong", {
        max: WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH,
      })
    : null;
  const approveErrorId = "create-wave-display-settings-error";
  const submissionLabelErrorId = "create-wave-submission-button-label-error";
  const proposalCardExcerptErrorId =
    "create-wave-proposal-card-excerpt-length-error";
  const submissionButtonLabel = display.submissionButtonLabel ?? "";
  const proposalCards = display.proposalCards ?? {
    mode: display.compactProposalCards === true ? "custom" : "standard",
    excerptMaxCharacters: DEFAULT_PROPOSAL_CARD_RECIPE.excerptMaxCharacters,
    showMediaThumbnail: DEFAULT_PROPOSAL_CARD_RECIPE.showMediaThumbnail,
  };
  const isDisplaySettingsCustomized =
    submissionButtonLabel.length > 0 ||
    (showApproveTabLabels &&
      (display.approve.approvalsTabLabel.length > 0 ||
        display.approve.approvedTabLabel.length > 0)) ||
    Boolean(
      display.proposalCards &&
      (proposalCards.mode !== "custom" ||
        proposalCards.excerptMaxCharacters !==
          DEFAULT_PROPOSAL_CARD_RECIPE.excerptMaxCharacters ||
        proposalCards.showMediaThumbnail !==
          DEFAULT_PROPOSAL_CARD_RECIPE.showMediaThumbnail)
    );
  const hasDisplaySettingsError =
    hasSubmissionLabelError ||
    hasProposalCardExcerptError ||
    approveErrorMessage !== null;

  const onLabelChange =
    (key: keyof CreateWaveApproveDisplayConfig) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...display,
        approve: {
          ...display.approve,
          [key]: event.target.value,
        },
      });
    };

  const onSubmissionButtonLabelChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const nextValue = event.target.value;
    onChange({
      ...display,
      submissionButtonLabel: nextValue.length ? nextValue : null,
    });
  };

  const onProposalCardModeChange = (mode: CreateWaveProposalCardMode) => {
    onChange({
      ...display,
      proposalCards: {
        ...proposalCards,
        mode,
      },
    });
  };

  const onProposalCardExcerptLengthChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.valueAsNumber;
    if (!Number.isFinite(value)) {
      return;
    }

    onChange({
      ...display,
      proposalCards: {
        ...proposalCards,
        excerptMaxCharacters: value,
      },
    });
  };

  const onProposalCardMediaThumbnailChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      ...display,
      proposalCards: {
        ...proposalCards,
        showMediaThumbnail: event.target.checked,
      },
    });
  };

  const inputClasses = ({
    hasError,
    hasValue,
  }: {
    readonly hasError: boolean;
    readonly hasValue: boolean;
  }) =>
    `${
      hasError
        ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
        : "tw-border-white/10 tw-caret-primary-400 tw-ring-white/10 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 focus:tw-border-primary-400 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400"
    } ${
      hasValue ? "tw-text-primary-400 focus:tw-text-white" : "tw-text-white"
    } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-950 focus:tw-outline-none sm:tw-text-sm`;

  const floatingLabelClasses = (hasError = false) =>
    `tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-whitespace-nowrap tw-bg-iron-950 tw-px-2 tw-text-sm tw-font-normal tw-duration-300 ${
      hasError
        ? "tw-text-error peer-focus:tw-text-error"
        : "tw-text-iron-500 peer-focus:tw-text-primary-400"
    }`;

  return (
    <CreateWaveAdvancedSection
      title={t(locale, "waves.create.overview.advancedTitle")}
      isCustomized={isDisplaySettingsCustomized}
      hasError={hasDisplaySettingsError}
      variant="filled"
    >
      <div className="tw-space-y-4 tw-p-5">
        <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
          {t(locale, "waves.create.overview.displaySettings")}
        </h3>
        <div className="tw-space-y-2">
          <div className="tw-group tw-relative tw-w-full">
            <input
              id="create-wave-submission-button-label"
              type="text"
              autoComplete="off"
              maxLength={WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH}
              value={submissionButtonLabel}
              onChange={onSubmissionButtonLabelChange}
              placeholder={getDefaultWaveSubmissionButtonLabel(
                WaveSubmissionExperience.DEFAULT
              )}
              aria-invalid={Boolean(submissionLabelErrorMessage)}
              aria-describedby={
                submissionLabelErrorMessage ? submissionLabelErrorId : undefined
              }
              className={inputClasses({
                hasError: Boolean(submissionLabelErrorMessage),
                hasValue: submissionButtonLabel.length > 0,
              })}
            />
            <label
              htmlFor="create-wave-submission-button-label"
              className={floatingLabelClasses(
                Boolean(submissionLabelErrorMessage)
              )}
            >
              {t(locale, "waves.submissionButtonLabel.label")}
            </label>
          </div>
          <CommonAnimationHeight>
            {submissionLabelErrorMessage ? (
              <div
                id={submissionLabelErrorId}
                className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-1"
              >
                <svg
                  className="tw-size-4 tw-flex-shrink-0 tw-text-error"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="tw-relative tw-z-10 tw-text-xs tw-font-medium tw-text-error">
                  {submissionLabelErrorMessage}
                </div>
              </div>
            ) : null}
          </CommonAnimationHeight>
        </div>
        <fieldset className="tw-m-0 tw-border-0 tw-p-0">
          <legend className={CREATE_WAVE_FORM_STYLES.fieldLabel}>
            {t(locale, "waves.proposalCard.appearanceLabel")}
          </legend>
          <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-3">
            {(["standard", "custom"] as const).map((mode) => {
              const isSelected = proposalCards.mode === mode;
              const isStandard = mode === "standard";
              const title = t(
                locale,
                isStandard
                  ? "waves.proposalCard.mode.standard.label"
                  : "waves.proposalCard.mode.custom.label"
              );
              const description = t(
                locale,
                isStandard
                  ? "waves.proposalCard.mode.standard.description"
                  : "waves.proposalCard.mode.custom.description"
              );

              return (
                <label
                  key={mode}
                  className={`tw-group tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-2 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 sm:tw-p-3 ${
                    isSelected
                      ? "tw-border-primary-500/60 tw-bg-primary-500/5"
                      : "tw-border-white/5 tw-bg-iron-950 hover:tw-border-white/10"
                  }`}
                >
                  <ProposalCardAppearancePreview mode={mode} />
                  <div className="tw-flex tw-items-start tw-gap-2 sm:tw-gap-3">
                    <input
                      id={mode}
                      type="radio"
                      name="proposal-card-appearance"
                      checked={isSelected}
                      onChange={() => onProposalCardModeChange(mode)}
                      className="tw-peer tw-sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`tw-mt-0.5 tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
                        isSelected
                          ? "tw-border-primary-400 tw-bg-primary-500/10"
                          : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
                      }`}
                    >
                      <span
                        className={`tw-size-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
                          isSelected ? "tw-scale-100" : "tw-scale-0"
                        }`}
                      />
                    </span>
                    <div className="tw-min-w-0 tw-whitespace-normal">
                      <span
                        className={`tw-block tw-text-sm tw-font-medium ${
                          isSelected
                            ? "tw-text-primary-400"
                            : "tw-text-iron-300 group-hover:tw-text-white"
                        }`}
                      >
                        {title}
                      </span>
                      <p
                        className={`tw-mb-0 tw-mt-1 tw-text-xs tw-font-normal tw-leading-4 ${
                          isSelected ? "tw-text-iron-300" : "tw-text-iron-400"
                        }`}
                      >
                        {description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <CommonAnimationHeight>
            {proposalCards.mode === "custom" ? (
              <div className="tw-pt-3">
                <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
                  <div className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-4">
                    <div className="tw-flex tw-min-h-10 tw-flex-col tw-items-start tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
                      <label
                        htmlFor="create-wave-proposal-card-excerpt-length"
                        className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300"
                      >
                        {t(locale, "waves.proposalCard.excerptLabel")}
                      </label>
                      <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
                        <input
                          id="create-wave-proposal-card-excerpt-length"
                          type="number"
                          inputMode="numeric"
                          min={PROPOSAL_CARD_EXCERPT_MIN_LENGTH}
                          max={PROPOSAL_CARD_EXCERPT_MAX_LENGTH}
                          step={1}
                          value={proposalCards.excerptMaxCharacters}
                          onChange={onProposalCardExcerptLengthChange}
                          aria-label={t(
                            locale,
                            "waves.proposalCard.excerptInputAriaLabel"
                          )}
                          aria-invalid={hasProposalCardExcerptError}
                          aria-describedby={
                            hasProposalCardExcerptError
                              ? proposalCardExcerptErrorId
                              : undefined
                          }
                          className={`${inputClasses({
                            hasError: hasProposalCardExcerptError,
                            hasValue: false,
                          })} !tw-h-9 !tw-w-20 !tw-bg-iron-950 !tw-px-3 !tw-py-1 focus:!tw-bg-iron-950`}
                        />
                        <span className="tw-text-xs tw-leading-4 tw-text-iron-400">
                          {t(locale, "waves.proposalCard.characters")}
                        </span>
                      </div>
                    </div>
                    <CommonAnimationHeight>
                      {hasProposalCardExcerptError ? (
                        <p
                          id={proposalCardExcerptErrorId}
                          className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-leading-5 tw-text-error"
                        >
                          {t(locale, "waves.proposalCard.excerptRangeError", {
                            min: PROPOSAL_CARD_EXCERPT_MIN_LENGTH,
                            max: PROPOSAL_CARD_EXCERPT_MAX_LENGTH,
                          })}
                        </p>
                      ) : null}
                    </CommonAnimationHeight>
                  </div>
                  <label
                    htmlFor="create-wave-proposal-card-media-thumbnail"
                    className="tw-flex tw-min-h-10 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-4"
                  >
                    <span className="tw-min-w-0 tw-text-sm tw-font-medium tw-text-iron-300">
                      {t(locale, "waves.proposalCard.mediaLabel")}
                    </span>
                    <input
                      id="create-wave-proposal-card-media-thumbnail"
                      type="checkbox"
                      checked={proposalCards.showMediaThumbnail}
                      onChange={onProposalCardMediaThumbnailChange}
                      className="tw-form-checkbox tw-size-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </CommonAnimationHeight>
        </fieldset>
        {showApproveTabLabels ? (
          <section
            aria-labelledby="create-wave-tab-labels-heading"
            className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-4"
          >
            <h4
              id="create-wave-tab-labels-heading"
              className={CREATE_WAVE_FORM_STYLES.fieldLabel}
            >
              {t(locale, "waves.proposalCard.tabLabelsLabel")}
            </h4>
            <p
              className={`tw-mt-1 tw-text-pretty ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
            >
              {t(locale, "waves.proposalCard.tabLabelsDescription")}
            </p>
            <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
              <div className="tw-group tw-relative tw-w-full">
                <input
                  id="create-wave-approvals-tab-label"
                  type="text"
                  autoComplete="off"
                  maxLength={APPROVE_WAVE_TAB_LABEL_MAX_LENGTH}
                  value={display.approve.approvalsTabLabel}
                  onChange={onLabelChange("approvalsTabLabel")}
                  placeholder={DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals}
                  aria-invalid={Boolean(approveErrorMessage)}
                  aria-describedby={
                    approveErrorMessage ? approveErrorId : undefined
                  }
                  className={inputClasses({
                    hasError: Boolean(approveErrorMessage),
                    hasValue: display.approve.approvalsTabLabel.length > 0,
                  })}
                />
                <label
                  htmlFor="create-wave-approvals-tab-label"
                  className={floatingLabelClasses(Boolean(approveErrorMessage))}
                >
                  {t(locale, "waves.proposalCard.approvalsTabLabel")}
                </label>
              </div>
              <div className="tw-group tw-relative tw-w-full">
                <input
                  id="create-wave-approved-tab-label"
                  type="text"
                  autoComplete="off"
                  maxLength={APPROVE_WAVE_TAB_LABEL_MAX_LENGTH}
                  value={display.approve.approvedTabLabel}
                  onChange={onLabelChange("approvedTabLabel")}
                  placeholder={DEFAULT_APPROVE_WAVE_TAB_LABELS.approved}
                  aria-invalid={Boolean(approveErrorMessage)}
                  aria-describedby={
                    approveErrorMessage ? approveErrorId : undefined
                  }
                  className={inputClasses({
                    hasError: Boolean(approveErrorMessage),
                    hasValue: display.approve.approvedTabLabel.length > 0,
                  })}
                />
                <label
                  htmlFor="create-wave-approved-tab-label"
                  className={floatingLabelClasses(Boolean(approveErrorMessage))}
                >
                  {t(locale, "waves.proposalCard.approvedTabLabel")}
                </label>
              </div>
            </div>
            <CommonAnimationHeight>
              {approveErrorMessage ? (
                <div
                  id={approveErrorId}
                  className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5"
                >
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-text-error"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="tw-relative tw-z-10 tw-text-xs tw-font-medium tw-text-error">
                    {approveErrorMessage}
                  </div>
                </div>
              ) : null}
            </CommonAnimationHeight>
          </section>
        ) : null}
      </div>
    </CreateWaveAdvancedSection>
  );
}
