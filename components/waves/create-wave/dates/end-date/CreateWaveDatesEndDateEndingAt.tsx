export default function CreateWaveDatesEndDateEndingAt({
  endDate,
}: {
  readonly endDate: string | null;
}) {
  return (
    <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-1.5">
      <svg
        className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-iron-300"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="tw-text-iron-400 tw-text-xs tw-font-medium tw-space-x-1">
        <span>Ending At:</span>
        <span className="tw-text-iron-500 tw-font-semibold">{endDate}</span>
      </span>
    </div>
  );
}
