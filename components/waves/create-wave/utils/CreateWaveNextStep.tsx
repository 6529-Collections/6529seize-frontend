export default function CreateWaveNextStep({
  disabled,
  label = "Next step",
  onClick,
}: {
  readonly disabled: boolean;
  readonly label?: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className={`${
        disabled
          ? "tw-bg-iron-800 tw-text-iron-600 tw-border-iron-800"
          : "tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600"
      } tw-relative tw-inline-flex tw-items-center tw-justify-center  tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold  tw-border tw-border-solid  tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
    >
      <span>{label}</span>
      <svg
        className="tw-h-5 tw-w-5 tw-ml-2"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 12H20M20 12L14 6M20 12L14 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
