export enum CreateWaveNextStepType {
  NEXT = "NEXT",
  SAVE = "SAVE",
}

export default function CreateWaveNextStep({
  disabled,
  stepType = CreateWaveNextStepType.NEXT,
  onClick,
}: {
  readonly disabled: boolean;
  readonly stepType?: CreateWaveNextStepType;
  readonly onClick: () => void;
}) {
  const components: Record<CreateWaveNextStepType, React.ReactNode> = {
    [CreateWaveNextStepType.NEXT]: (
      <button
        onClick={onClick}
        type="button"
        disabled={disabled}
        className={`${
          disabled
            ? "tw-bg-iron-800 tw-text-iron-600 tw-border-iron-800"
            : "tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600"
        } tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-6 tw-py-3 tw-text-base tw-font-semibold  tw-border tw-border-solid  tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
      >
        <span>Next</span>
      </button>
    ),
    [CreateWaveNextStepType.SAVE]: (
      <button
        onClick={onClick}
        className="tw-relative tw-inline-flex tw-items-center tw-gap-x-2 tw-justify-center tw-px-4 tw-py-3 tw-border-0 tw-text-base tw-font-medium tw-rounded-lg tw-text-white tw-bg-gradient-to-r tw-from-blue-500 tw-via-blue-600 tw-to-blue-700 hover:tw-bg-gradient-to-br tw-transform hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-in-out tw-shadow-lg"
      >
        <svg
          className="tw-h-5 tw-w-5 -tw-ml-1 tw-text-white tw-animate-bounce"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-11.293a1 1 0 00-1.414-1.414L9 8.586 7.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>

        <span>Complete</span>
      </button>
    ),
  };

  return components[stepType];
}
