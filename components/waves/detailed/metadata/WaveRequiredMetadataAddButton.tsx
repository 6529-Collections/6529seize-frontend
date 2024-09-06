export default function WaveRequiredMetadataAddButton({
  onAdd,
}: {
  readonly onAdd: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onAdd}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-text-sm tw-font-medium tw-gap-x-1 tw-flex tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        <span>Add new</span>
      </button>
    </div>
  );
}
