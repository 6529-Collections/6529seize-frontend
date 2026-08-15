import type { ReactNode } from "react";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

export function getVotingSettingInputClasses({
  hasError,
  hasValue,
}: {
  readonly hasError: boolean;
  readonly hasValue: boolean;
}) {
  const stateClasses = hasError
    ? "tw-caret-error tw-ring-error focus:tw-ring-error"
    : "tw-caret-primary-400 tw-ring-white/10 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 focus:tw-ring-primary-400";
  const valueClasses = hasValue
    ? "tw-text-primary-400 focus:tw-text-white"
    : "tw-text-white";

  return `${stateClasses} ${valueClasses} tw-form-input tw-block tw-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-base tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset sm:tw-text-sm`;
}

export default function VotingSettingBox({
  children,
  errorId,
  errorMessage,
  hasError,
  helpId,
  helpText,
  inputId,
  label,
  surface = "primary",
}: {
  readonly children: ReactNode;
  readonly errorId: string;
  readonly errorMessage: string;
  readonly hasError: boolean;
  readonly helpId: string;
  readonly helpText: ReactNode;
  readonly inputId: string;
  readonly label: string;
  readonly surface?: "primary" | "nested" | "plain";
}) {
  const isPlain = surface === "plain";
  let stateClasses = "";
  let surfaceClasses = "";

  if (!isPlain) {
    stateClasses = hasError
      ? "tw-border-error focus-within:tw-border-error"
      : "tw-border-white/5 desktop-hover:hover:tw-border-white/10 focus-within:tw-border-primary-400";
    surfaceClasses =
      surface === "nested" ? "tw-bg-iron-950/40" : "tw-bg-iron-900/60";
  }
  const containerClasses = isPlain
    ? ""
    : "tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-shadow-inner";

  return (
    <div
      data-testid={`${inputId}-setting`}
      data-surface={surface}
      className={`${stateClasses} ${surfaceClasses} ${containerClasses} tw-transition tw-duration-300 tw-ease-out`}
    >
      <label
        htmlFor={inputId}
        className={`tw-mb-2 tw-block ${CREATE_WAVE_FORM_STYLES.fieldLabel} ${
          hasError ? "tw-text-error" : "tw-text-iron-100"
        }`}
      >
        {label}
      </label>
      {children}
      {hasError && (
        <div
          id={errorId}
          className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-2"
        >
          <svg
            className="tw-size-5 tw-flex-shrink-0 tw-text-error"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
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
            {errorMessage}
          </div>
        </div>
      )}
      <p
        id={helpId}
        className={`tw-mt-3 ${CREATE_WAVE_FORM_STYLES.supportingText}`}
      >
        {helpText}
      </p>
    </div>
  );
}
