export default function CommonTablePagination({
  small,
  currentPage,
  setCurrentPage,
  totalPages,
  haveNextPage,
  loading = false,
}: {
  readonly small: boolean;
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly totalPages: number | null;
  readonly haveNextPage: boolean;
  readonly loading?: boolean;
}) {
  return (
    <div
      className={`${
        small
          ? "tw-px-4 sm:tw-px-6 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800"
          : ""
      } tw-pt-4 tw-pb-3`}
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        {typeof totalPages === "number" ? (
          <div className="tw-text-sm tw-text-iron-300 tw-font-medium tw-mr-3">
            Page {currentPage} of {totalPages}
          </div>
        ) : (
          <div></div>
        )}

        <span className="tw-isolate tw-inline-flex tw-gap-x-3 tw-rounded-md tw-shadow-sm">
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={loading}
              type="button"
              className="tw-relative tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="-tw-ml-1.5 tw-h-5 tw-w-5"
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
          {haveNextPage && (
            <button
              disabled={loading}
              onClick={() => setCurrentPage(currentPage + 1)}
              type="button"
              className="tw-relative tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              <span>Next</span>
              <svg
                className="-tw-mr-1.5 tw-h-5 tw-w-5"
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
