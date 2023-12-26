export default function CommonTablePagination({
  small,
  currentPage,
  setCurrentPage,
  totalPages,
}: {
  readonly small: boolean;
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly totalPages: number;
}) {
  return (
    <div
      className={`${
        small ? "tw-px-6 md:tw-px-8" : ""
      } tw-mt-4  tw-pb-6 md:tw-pb-4 tw-flex tw-justify-end`}
    >
      <div className="tw-flex tw-items-center">
        <div className="tw-text-sm tw-text-neutral-400 tw-font-normal tw-mr-3">
          {currentPage} of {totalPages}
        </div>

        <span className="tw-isolate tw-inline-flex tw-gap-x-3 tw-rounded-md tw-shadow-sm">
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              type="button"
              className="tw-relative tw-text-sm tw-font-medium tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-2.5 tw-py-2 tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="-tw-ml-1 tw-h-5 tw-w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Previous</span>
            </button>
          )}
          {currentPage < totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              type="button"
              className="tw-relative tw-text-sm tw-font-medium tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-2.5 tw-py-2 tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              <span>Next</span>
              <svg
                className="-tw-mr-1 tw-h-5 tw-w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
