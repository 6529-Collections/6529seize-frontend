export default function CreateWaveBackStep({
  onPreviousStep,
}: {
  readonly onPreviousStep: () => void;
}) {
  return (
    <button
      onClick={onPreviousStep}
      type="button"
      className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50"
    >
      <svg
        className="tw-mr-2 tw-size-6 tw-flex-shrink-0"
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
