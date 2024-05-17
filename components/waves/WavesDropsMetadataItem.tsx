export default function WavesDropsMetadataItem() {
  return (
    <div className="tw-col-span-full">
      <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-2">
        <div className="tw-px-3 tw-py-1.5 tw-bg-iron-800 tw-rounded-lg tw-inline-flex tw-items-center tw-justify-between tw-gap-x-3 tw-truncate tw-text-left tw-border tw-border-solid tw-border-iron-700 hover:tw-border-iron-600 tw-transition tw-duration-300 tw-ease-out">
          <p className="tw-text-sm tw-font-normal tw-mb-0 tw-truncate">
            <span className="tw-text-iron-50 tw-font-medium tw-pr-1.5">
              Artist:
            </span>
            <span className="tw-text-iron-400">text</span>
          </p>
          <button
            type="button"
            className="tw-h-8 tw-w-8 tw-group tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300 group-hover:tw-text-red tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
