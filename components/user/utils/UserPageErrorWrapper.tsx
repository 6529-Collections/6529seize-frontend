export default function UserPageErrorWrapper({
  closeError,
  children,
}: {
  readonly closeError: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-relative tw-w-full md:tw-w-auto tw-inline-flex tw-items-center tw-rounded-lg tw-bg-red/5 tw-border tw-border-solid tw-border-red/30 tw-p-4">
      <div className="tw-absolute tw-right-2 tw-top-2">
        <button
          onClick={closeError}
          type="button"
          title="Close"
          aria-label="Close"
          className="tw-group tw-bg-transparent tw-border-none tw-inline-flex tw-rounded-md focus:tw-outline-none"
        >
          <svg
            className="tw-w-6 tw-h-6 tw-text-iron-300 group-hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 7L7 17M7 7L17 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="tw-flex">
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {children}
      </div>
    </div>
  );
}
