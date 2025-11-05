export default function UserPageIdentityAddStatementsContactHeader({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  return (
    <div className="tw-flex tw-justify-between">
      <div className="tw-max-w-xl sm:tw-flex tw-items-center sm:tw-space-x-4">
        <div>
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800">
            <svg
              className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-100 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 8.5H12M7 12H15M9.68375 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V20.3355C3 20.8684 3 21.1348 3.10923 21.2716C3.20422 21.3906 3.34827 21.4599 3.50054 21.4597C3.67563 21.4595 3.88367 21.2931 4.29976 20.9602L6.68521 19.0518C7.17252 18.662 7.41617 18.4671 7.68749 18.3285C7.9282 18.2055 8.18443 18.1156 8.44921 18.0613C8.74767 18 9.0597 18 9.68375 18Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
          <p className="tw-mt-3 sm:tw-mt-0 tw-whitespace-wrap md:tw-max-w-sm tw-text-lg tw-text-iron-100 tw-font-medium tw-mb-0">
          Add Contact
        </p>
      </div>
      <div className="tw-absolute tw-right-4 tw-top-4 sm:tw-top-6 tw-flex tw-justify-between tw-items-center">
        <button
          onClick={onClose}
          type="button"
          className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
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
