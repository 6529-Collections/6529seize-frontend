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
          ? "tw-opacity-50"
          : "hover:tw-bg-primary-600 hover:tw-border-primary-600"
      } tw-relative tw-inline-flex tw-items-center tw-justify-center tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
    >
      <span>{label}</span>
    </button>
  );
}
