export default function CommonInfoBox({
  message,
  widthFull = false,
}: {
  readonly message: string;
  readonly widthFull?: boolean;
}) {
  return (
    <div
      className={`${
        !widthFull && "sm:tw-w-auto"
      } tw-w-full tw-inline-flex tw-items-center tw-rounded-lg tw-bg-primary-400/5 tw-border tw-border-solid tw-border-primary-400/30 tw-px-4 tw-py-3`}
    >
      <div className="tw-flex tw-items-center">
        <svg
          className="tw-flex-shrink-0 tw-self-center tw-w-5 tw-h-5 tw-text-primary-300"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="tw-ml-3 tw-self-center">
          <h3 className="tw-text-sm sm:tw-text-md tw-mb-0 tw-font-semibold tw-text-primary-300 tw-break-all">
            {message}
          </h3>
        </div>
      </div>
    </div>
  );
}
