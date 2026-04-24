import type { ChangeEvent } from "react";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

export default function MaxVotesPerIdentityInput({
  value,
  errors,
  onChange,
}: {
  readonly value: number | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onChange: (value: number | null) => void;
}) {
  const hasError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID
  );
  const hasValue = value !== null && Number.isFinite(value);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.trim();
    if (!rawValue) {
      onChange(null);
      return;
    }

    const nextValue = Number(rawValue);
    onChange(Number.isInteger(nextValue) && nextValue > 0 ? nextValue : null);
  };

  return (
    <div className="tw-mt-6 tw-border-t tw-border-iron-700 tw-pt-6">
      <div className="tw-group tw-relative tw-w-full">
        <input
          type="number"
          min={1}
          step={1}
          value={hasValue ? value.toString() : ""}
          onChange={onInputChange}
          id="max-votes-per-identity-per-drop"
          autoComplete="off"
          className={`${
            hasError
              ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
              : "tw-border-iron-650 tw-caret-primary-400 tw-ring-iron-650 focus:tw-border-primary-400 focus:tw-ring-primary-400"
          } ${
            hasValue
              ? "tw-text-primary-400 focus:tw-text-white"
              : "tw-text-white peer-focus:tw-text-white"
          } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm`}
          placeholder=" "
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? "max-votes-per-identity-per-drop-error max-votes-per-identity-per-drop-help"
              : "max-votes-per-identity-per-drop-help"
          }
        />
        <label
          htmlFor="max-votes-per-identity-per-drop"
          className={`${
            hasError
              ? "peer-focus:tw-text-error"
              : "peer-focus:tw-text-primary-400"
          } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
        >
          Vote cap per identity
        </label>
      </div>
      {hasError && (
        <div
          id="max-votes-per-identity-per-drop-error"
          className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5"
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
            Enter a whole number greater than 0.
          </div>
        </div>
      )}
      <p
        id="max-votes-per-identity-per-drop-help"
        className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-text-iron-400"
      >
        Optional. Leave blank to use each identity&apos;s full voting power. Set
        1 for one identity = one vote.
      </p>
    </div>
  );
}
