export default function SelectGroupModalHeader({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  return (
    <div className="tw-flex tw-justify-between tw-px-4 tw-pt-6">
      <div className="tw-max-w-xl sm:tw-flex tw-items-center sm:tw-space-x-4">
        <div>
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700">
            <svg
              className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
          </span>
        </div>
        <p className="tw-mt-3 sm:tw-mt-0 tw-whitespace-wrap md:tw-max-w-sm tw-text-lg tw-text-iron-50 tw-font-medium tw-mb-0">
          Find a group
        </p>
      </div>
      <div className="tw-absolute tw-right-4 tw-top-4 sm:tw-top-6 tw-flex tw-justify-between tw-items-center">
        <button
          onClick={onClose}
          type="button"
          className="tw-p-2.5 -tw-mx-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-sr-only tw-text-sm">Close</span>
          <svg
            className="tw-h-6 tw-w-6"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
