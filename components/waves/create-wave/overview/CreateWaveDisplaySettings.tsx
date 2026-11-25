import CreateWaveToggle from "../utils/CreateWaveToggle";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import CreateWaveAdvancedSection from "@/components/waves/create-wave/utils/CreateWaveAdvancedSection";
import {
  CREATE_WAVE_FORM_STYLES,
  getCreateWaveOptionStyles,
} from "@/components/waves/create-wave/utils/createWaveFormStyles";
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
  isSelected,
  isCompetition,
}: {
  readonly mode: CreateWaveProposalCardMode;
  readonly isSelected: boolean;
  readonly isCompetition: boolean;
}) {
  const optionStyles = getCreateWaveOptionStyles(isCompetition);
  const accentClass = isSelected ? "tw-bg-primary-400/80" : "tw-bg-iron-650";
  const detailClass = isSelected ? "tw-bg-primary-400/30" : "tw-bg-iron-800";
  const previewLineHeight = isCompetition ? "tw-h-0.5" : "tw-h-1 sm:tw-h-0.5";
  return (
    <div aria-hidden="true" className={optionStyles.preview}>
      {mode === "standard" ? (
        <div className="tw-flex tw-h-full tw-flex-col tw-justify-center">
          <div className="tw-flex tw-items-center tw-gap-1.5">
            <span
              className={`tw-flex-shrink-0 tw-rounded-full ${isCompetition ? "tw-size-1.5" : "tw-size-3 sm:tw-size-1.5"} ${accentClass}`}
            />
            <span
              className={`tw-h-1 tw-rounded-full ${isCompetition ? "tw-w-6" : "tw-w-10 sm:tw-w-6"} ${accentClass}`}
            />
          </div>
          <div className="tw-mt-1.5 tw-space-y-1">
            <span
              className={`tw-block tw-w-full tw-rounded-full ${previewLineHeight} ${detailClass}`}
            />
            <span
              className={`tw-block tw-w-11/12 tw-rounded-full tw-bg-iron-800 ${previewLineHeight}`}
            />
            <span
              className={`tw-block tw-w-full tw-rounded-full tw-bg-iron-800 ${previewLineHeight}`}
            />
            <span
              className={`tw-block tw-w-3/4 tw-rounded-full tw-bg-iron-800 ${previewLineHeight}`}
            />
            <span
              className={`${isCompetition ? "tw-hidden" : "tw-block tw-h-1 tw-w-5/6 tw-rounded-full tw-bg-iron-800 sm:tw-hidden"}`}
            />
          </div>
        </div>
      ) : (
        <div className="tw-flex tw-h-full tw-items-center tw-gap-2">
          <div className="tw-min-w-0 tw-flex-1">
            <span
              className={`tw-block tw-w-2/3 tw-rounded-full ${isCompetition ? "tw-h-1" : "tw-h-1.5 sm:tw-h-1"} ${accentClass}`}
            />
            <span
              className={`tw-mt-1.5 tw-block tw-w-4/5 tw-rounded-full tw-bg-iron-800 ${previewLineHeight}`}
            />
          </div>
          <span
            className={`tw-flex-shrink-0 tw-rounded-md ${isCompetition ? "tw-size-6" : "tw-size-8 sm:tw-size-6"} ${detailClass}`}
          />
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
  embedded = false,
  isCompetition = false,
}: {
  readonly display: CreateWaveDisplayConfig;
  readonly errors: readonly CREATE_WAVE_VALIDATION_ERROR[];
  readonly onChange: (display: CreateWaveDisplayConfig) => void;
  readonly waveType: ApiWaveType;
  readonly embedded?: boolean;
  readonly isCompetition?: boolean;
}) {
  const optionStyles = getCreateWaveOptionStyles(isCompetition);
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

  const onProposalCardMediaThumbnailChange = (checked: boolean) => {
    onChange({
      ...display,
      proposalCards: {
        ...proposalCards,
        showMediaThumbnail: checked,
      },
    });
  };

  const compactInputSize = isCompetition
    ? "tw-h-9 tw-w-10 tw-px-1 tw-py-1 min-[361px]:tw-w-14 min-[361px]:tw-px-3 md:tw-w-20"
    : "tw-h-9 tw-w-20 tw-px-3 tw-py-1";

  const inputClasses = ({
    hasError,
    hasValue,
    compact = false,
  }: {
    readonly hasError: boolean;
    readonly hasValue: boolean;
    readonly compact?: boolean;
  }) =>
    `${
      hasError
        ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
        : "tw-border-white/10 tw-caret-primary-400 tw-ring-white/10 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 focus:tw-border-primary-400 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400"
    } ${
      hasValue ? "tw-text-primary-400 focus:tw-text-white" : "tw-text-white"
    } tw-peer tw-form-input tw-block tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 ${compact ? compactInputSize : "tw-w-full tw-px-4 tw-py-3"} tw-text-base tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none sm:tw-text-sm`;

  const floatingLabelClasses = (hasError = false) =>
    `tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-whitespace-nowrap tw-bg-iron-950 tw-px-2 tw-text-sm tw-font-normal tw-duration-300 ${
      hasError
        ? "tw-text-error peer-focus:tw-text-error"
        : "tw-text-iron-500 peer-focus:tw-text-primary-400"
    }`;

  const content = (
    <div
      className={`tw-space-y-4 tw-p-5 ${isCompetition ? "max-md:tw-p-4" : ""}`}
    >
      <h3
        className={`${CREATE_WAVE_FORM_STYLES.sectionTitle} ${isCompetition ? "max-md:tw-mb-3 max-md:tw-text-[15px] max-md:tw-leading-5 max-md:tw-text-iron-50" : ""}`}
      >
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
        <legend
          className={`${CREATE_WAVE_FORM_STYLES.fieldLabel} ${isCompetition ? "max-md:tw-mb-3 max-md:tw-text-[15px] max-md:tw-leading-5 max-md:tw-text-iron-50" : ""}`}
        >
          {t(locale, "waves.proposalCard.appearanceLabel")}
        </legend>
        <div
          className={`tw-mt-3 ${optionStyles.grid} ${isCompetition ? "max-md:tw-mt-0" : ""}`}
        >
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
                className={`${optionStyles.card} ${
                  isSelected ? optionStyles.selected : optionStyles.unselected
                }`}
              >
                <ProposalCardAppearancePreview
                  mode={mode}
                  isSelected={isSelected}
                  isCompetition={isCompetition}
                />
                <div className={optionStyles.content}>
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
                    className={`tw-order-last tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-colors motion-reduce:tw-transition-none ${
                      isSelected
                        ? "tw-border-primary-400 tw-bg-primary-500/10"
                        : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
                    }`}
                  >
                    <span
                      className={`tw-size-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 motion-reduce:tw-transition-none ${
                        isSelected ? "tw-scale-100" : "tw-scale-0"
                      }`}
                    />
                  </span>
                  <div className="tw-min-w-0 tw-flex-1 tw-whitespace-normal">
                    <span
                      className={`${optionStyles.title} ${
                        isSelected
                          ? "tw-text-primary-400"
                          : "tw-text-iron-300 group-hover:tw-text-white"
                      }`}
                    >
                      {title}
                    </span>
                    <p
                      className={`tw-mb-0 tw-mt-1 ${optionStyles.description} ${isSelected ? optionStyles.selectedDescription : optionStyles.unselectedDescription}`}
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
              <div
                className={
                  isCompetition
                    ? "tw-grid tw-grid-cols-1 tw-gap-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 md:tw-grid-cols-2 md:tw-gap-3 md:tw-overflow-visible md:tw-rounded-none md:tw-border-0 md:tw-bg-transparent"
                    : "tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2"
                }
              >
                <div
                  className={
                    isCompetition
                      ? "tw-min-w-0 md:tw-rounded-xl md:tw-border md:tw-border-solid md:tw-border-white/5 md:tw-bg-iron-950/70 md:tw-p-4"
                      : "tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-4"
                  }
                >
                  <div
                    className={
                      isCompetition
                        ? "tw-flex tw-min-h-[52px] tw-flex-nowrap tw-items-center tw-justify-between tw-gap-1 tw-px-3.5 tw-py-2.5 min-[361px]:tw-gap-3 md:tw-min-h-10 md:tw-flex-wrap md:tw-justify-normal md:tw-p-0"
                        : "tw-flex tw-min-h-10 tw-flex-wrap tw-items-center tw-gap-3"
                    }
                  >
                    <label
                      htmlFor="create-wave-proposal-card-excerpt-length"
                      className={`tw-whitespace-nowrap tw-font-medium tw-text-iron-300 ${isCompetition ? "tw-text-meta min-[361px]:tw-text-sm" : "tw-text-sm"}`}
                    >
                      {t(locale, "waves.proposalCard.excerptLabel")}
                    </label>
                    <div
                      className={`tw-flex tw-flex-shrink-0 tw-items-center ${isCompetition ? "tw-gap-1 min-[361px]:tw-gap-2" : "tw-gap-2"}`}
                    >
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
                        className={inputClasses({
                          hasError: hasProposalCardExcerptError,
                          hasValue: false,
                          compact: true,
                        })}
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
                {isCompetition ? (
                  <div className="tw-min-h-[52px] tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-3.5 tw-py-2.5 md:tw-flex md:tw-items-center md:tw-rounded-xl md:tw-border md:tw-border-white/5 md:tw-bg-iron-950/70 md:tw-p-4">
                    <CreateWaveToggle
                      variant="decision-media"
                      displayLabel
                      id="create-wave-proposal-card-media-thumbnail"
                      label={t(locale, "waves.proposalCard.mediaLabel")}
                      enabled={proposalCards.showMediaThumbnail}
                      onChange={onProposalCardMediaThumbnailChange}
                      checkboxClassName="tw-form-checkbox tw-size-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400 md:tw-order-last"
                    />
                  </div>
                ) : (
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
                      onChange={(event) =>
                        onProposalCardMediaThumbnailChange(event.target.checked)
                      }
                      className="tw-form-checkbox tw-size-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400"
                    />
                  </label>
                )}
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
  );
  return embedded ? (
    content
  ) : (
    <CreateWaveAdvancedSection
      title={t(locale, "waves.create.overview.advancedTitle")}
      isCustomized={isDisplaySettingsCustomized}
      hasError={hasDisplaySettingsError}
      variant="filled"
    >
      {content}
    </CreateWaveAdvancedSection>
  );
}
