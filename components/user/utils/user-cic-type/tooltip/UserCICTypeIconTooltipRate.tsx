export default function UserCICTypeIconTooltipRate() {
  return (
    <div className="tw-mt-3.5 tw-pt-3.5 tw-border-t tw-border-solid tw-border-neutral-600 tw-border-x-0 tw-border-b-0">
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        <a
          href=""
          target="blank"
          className="tw-flex tw-items-center tw-text-neutral-100 tw-text-sm tw-font-medium tw-no-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span>See Identity Page</span>
          <svg
            className="tw-flex-shrink-0 tw-ml-2 tw-h-5 tw-w-5"
            viewBox="0 0 24 24"
            fill="none"
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
        </a>
        <button
          type="button"
          className="tw-cursor-pointer tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          CIC Rate
        </button>
      </div>
    </div>
  );
}