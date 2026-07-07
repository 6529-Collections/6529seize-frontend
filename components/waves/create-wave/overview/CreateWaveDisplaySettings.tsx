import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import {
  APPROVE_WAVE_TAB_LABEL_MAX_LENGTH,
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH,
  getEffectiveApproveWaveTabLabels,
  getDefaultWaveSubmissionButtonLabel,
} from "@/helpers/waves/wave-metadata.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CreateWaveApproveDisplayConfig,
  CreateWaveDisplayConfig,
} from "@/types/waves.types";
import type { ChangeEvent } from "react";

const getApproveErrorMessage = (
  errors: readonly CREATE_WAVE_VALIDATION_ERROR[]
): string | null => {
  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_TOO_LONG
    )
  ) {
    return `Labels must be ${APPROVE_WAVE_TAB_LABEL_MAX_LENGTH} characters or fewer.`;
  }

  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE
    )
  ) {
    return "Use two different tab labels.";
  }

  if (
    errors.includes(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED
    )
  ) {
    return "Labels cannot match existing tabs.";
  }

  return null;
};

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
  const showApproveTabLabels = waveType === ApiWaveType.Approve;
  const hasSubmissionLabelError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_BUTTON_LABEL_TOO_LONG
  );
  const approveErrorMessage = getApproveErrorMessage(errors);
  const submissionLabelErrorMessage = hasSubmissionLabelError
    ? t(DEFAULT_LOCALE, "waves.submissionButtonLabel.errorTooLong", {
        max: WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH,
      })
    : null;
  const approveErrorId = "create-wave-display-settings-error";
  const submissionLabelErrorId = "create-wave-submission-button-label-error";
  const submissionButtonLabel = display.submissionButtonLabel ?? "";
  const labels = getEffectiveApproveWaveTabLabels(display.approve);

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
        : "tw-border-white/5 tw-caret-primary-400 tw-ring-white/5 hover:tw-ring-white/10 focus:tw-border-primary-500/50 focus:tw-ring-primary-400"
    } ${
      hasValue ? "tw-text-primary-400 focus:tw-text-white" : "tw-text-white"
    } tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none sm:tw-text-sm`;

  return (
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-6">
      <div className="tw-space-y-3">
        <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
          Display settings
        </p>
        <label className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-px-4 tw-py-3">
          <span className="tw-text-sm tw-font-medium tw-text-iron-200">
            Show outcomes
          </span>
          <input
            type="checkbox"
            checked={display.outcomesVisible}
            onChange={(event) =>
              onChange({
                ...display,
                outcomesVisible: event.target.checked,
              })
            }
            className="tw-form-checkbox tw-size-5 tw-rounded tw-border-iron-600 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400"
          />
        </label>
        <div className="tw-space-y-2">
          <label
            htmlFor="create-wave-submission-button-label"
            className="tw-block tw-text-sm tw-font-medium tw-text-iron-400"
          >
            {t(DEFAULT_LOCALE, "waves.submissionButtonLabel.label")}
          </label>
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
        {showApproveTabLabels ? (
          <>
            <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
              <div className="tw-space-y-2">
                <label
                  htmlFor="create-wave-approvals-tab-label"
                  className="tw-block tw-text-sm tw-font-medium tw-text-iron-400"
                >
                  Approvals tab label
                </label>
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
              </div>
              <div className="tw-space-y-2">
                <label
                  htmlFor="create-wave-approved-tab-label"
                  className="tw-block tw-text-sm tw-font-medium tw-text-iron-400"
                >
                  Approved tab label
                </label>
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
              </div>
            </div>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-400">
              <span className="tw-rounded-md tw-bg-iron-900 tw-px-3 tw-py-1.5">
                Chat
              </span>
              <span className="tw-rounded-md tw-bg-iron-800 tw-px-3 tw-py-1.5 tw-text-iron-200">
                {labels.approvals}
              </span>
              <span className="tw-rounded-md tw-bg-iron-800 tw-px-3 tw-py-1.5 tw-text-iron-200">
                {labels.approved}
              </span>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
