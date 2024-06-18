export default function CreateWaveDropsMetadataAddRowButton({
  onAddNewRow,
}: {
  readonly onAddNewRow: () => void;
}) {
  return (
    <div className="tw-flex tw-justify-center">
      <button
        onClick={onAddNewRow}
        type="button"
        className="tw-py-1 tw-px-2 tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-text-iron-400 tw-font-medium hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-h-5 tw-w-5 tw-flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Add more</span>
      </button>
    </div>
  );
}
