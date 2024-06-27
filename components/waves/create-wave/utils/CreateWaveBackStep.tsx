export default function CreateWaveBackStep({
  onPreviousStep,
}: {
  readonly onPreviousStep: () => void;
}) {
  return (
    <button
      onClick={onPreviousStep}
      type="button"
      className="tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-6 tw-py-3 
      tw-text-base tw-font-semibold tw-border tw-border-solid tw-border-transparent tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
    >
      <svg
        className="tw-size-6 tw-mr-2 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 12H4M4 12L10 18M4 12L10 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span>Previous</span>
    </button>
  );
}
