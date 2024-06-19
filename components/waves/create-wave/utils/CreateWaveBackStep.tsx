export default function CreateWaveBackStep({
  onPreviousStep,
}: {
  readonly onPreviousStep: () => void;
}) {
  return (
    <button
      onClick={onPreviousStep}
      type="button"
      className="tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-6 tw-py-3 tw-text-base tw-font-semibold tw-border tw-border-solid tw-border-transparent tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
    >
      <span>Previous</span>
    </button>
  );
}
