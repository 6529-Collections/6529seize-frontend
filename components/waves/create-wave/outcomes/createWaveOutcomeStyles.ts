export const CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES =
  "tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-white/10 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm";

export const CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES =
  "tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-sm tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4";

export function getCreateWaveOutcomeInputStateClasses({
  hasError,
  hasValue,
}: {
  readonly hasError: boolean;
  readonly hasValue: boolean;
}) {
  const validationClasses = hasError
    ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
    : "tw-border-white/5 tw-caret-primary-400 tw-ring-white/5 focus:tw-border-primary-500/50 focus:tw-ring-primary-400";
  const valueClasses = hasValue
    ? "tw-text-primary-400 focus:tw-text-white"
    : "tw-text-white";

  return `${validationClasses} ${valueClasses}`;
}

export function getCreateWaveOutcomeLabelStateClasses(hasError: boolean) {
  return hasError
    ? "tw-text-error peer-focus:tw-text-error"
    : "peer-focus:tw-text-primary-400";
}
