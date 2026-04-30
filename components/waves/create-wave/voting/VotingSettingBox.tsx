import type { ReactNode } from "react";

export function getVotingSettingInputClasses({
  hasError,
  hasValue,
}: {
  readonly hasError: boolean;
  readonly hasValue: boolean;
}) {
  const stateClasses = hasError
    ? "tw-caret-error tw-ring-error focus:tw-ring-error"
    : "tw-caret-primary-400 tw-ring-white/5 hover:tw-ring-white/10 focus:tw-ring-primary-400";
  const valueClasses = hasValue
    ? "tw-text-primary-400 focus:tw-text-white"
    : "tw-text-white";

  return `${stateClasses} ${valueClasses} tw-form-input tw-block tw-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-black/20 tw-px-3 tw-py-2.5 tw-text-base tw-font-semibold tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-black/20 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm`;
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
}: {
  readonly children: ReactNode;
  readonly errorId: string;
  readonly errorMessage: string;
  readonly hasError: boolean;
  readonly helpId: string;
  readonly helpText: ReactNode;
  readonly inputId: string;
  readonly label: string;
}) {
  const stateClasses = hasError
    ? "tw-border-error tw-ring-error focus-within:tw-border-error focus-within:tw-ring-error"
    : "tw-border-white/5 tw-ring-white/5 hover:tw-border-white/10 hover:tw-ring-white/10 focus-within:tw-border-primary-400 focus-within:tw-ring-primary-400";

  return (
    <div
      data-testid={`${inputId}-setting`}
      className={`${stateClasses} tw-rounded-xl tw-border tw-border-solid tw-bg-iron-900 tw-p-4 tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
    >
      <label
        htmlFor={inputId}
        className={`tw-mb-2 tw-block tw-text-sm tw-font-semibold ${
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
        className="tw-mb-0 tw-mt-3 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400"
      >
        {helpText}
      </p>
    </div>
  );
}
