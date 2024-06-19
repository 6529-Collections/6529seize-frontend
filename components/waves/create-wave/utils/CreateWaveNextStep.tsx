export default function CreateWaveNextStep({
  disabled,
  label = "Next",
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
      } tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-6 tw-py-3 tw-text-base tw-font-semibold  tw-border tw-border-solid  tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
    >
      <span>{label}</span>
    </button>
  );
}
