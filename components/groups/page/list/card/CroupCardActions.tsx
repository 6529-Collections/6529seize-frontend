export default function CroupCardActions() {
  return (
    <div className="tw-pt-3 tw-px-4 sm:tw-px-6 tw-flex tw-items-center tw-justify-between">
      <div className="-tw-ml-3.5 tw-flex tw-gap-x-3 tw-divide-x tw-divide-iron-700 tw-divide-solid tw-divide-y-0">
        <button
          type="button"
          className="tw-inline-flex tw-items-center tw-border-0 tw-bg-transparent tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-size-5 t w-flex-shrink-0 tw-mr-2"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>View members</span>
        </button>
        <button
          type="button"
          className="tw-inline-flex tw-items-center tw-border-0 tw-bg-transparent tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Rep all
        </button>
        <button
          type="button"
          className="tw-inline-flex tw-items-center tw-border-0 tw-bg-transparent tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          CIC all
        </button>
      </div>
      <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-2">
        <svg
          className="tw-w-5 tw-h-5 tw-flex-shrink-0 tw-text-iron-300"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 8V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H5.2C4.0799 2 3.51984 2 3.09202 2.21799C2.71569 2.40973 2.40973 2.71569 2.21799 3.09202C2 3.51984 2 4.0799 2 5.2V12.8C2 13.9201 2 14.4802 2.21799 14.908C2.40973 15.2843 2.71569 15.5903 3.09202 15.782C3.51984 16 4.0799 16 5.2 16H8M12 15L14 17L18.5 12.5M11.2 22H18.8C19.9201 22 20.4802 22 20.908 21.782C21.2843 21.5903 21.5903 21.2843 21.782 20.908C22 20.4802 22 19.9201 22 18.8V11.2C22 10.0799 22 9.51984 21.782 9.09202C21.5903 8.71569 21.2843 8.40973 20.908 8.21799C20.4802 8 19.9201 8 18.8 8H11.2C10.0799 8 9.51984 8 9.09202 8.21799C8.71569 8.40973 8.40973 8.71569 8.21799 9.09202C8 9.51984 8 10.0799 8 11.2V18.8C8 19.9201 8 20.4802 8.21799 20.908C8.40973 21.2843 8.71569 21.5903 9.09202 21.782C9.51984 22 10.0799 22 11.2 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="tw-font-medium tw-text-iron-400">100</span>
      </div>
    </div>
  );
}