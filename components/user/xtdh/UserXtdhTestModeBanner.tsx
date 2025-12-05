export function UserXtdhTestModeBanner() {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/20 tw-bg-primary-500/10 tw-px-4 tw-py-3">
      <div className="tw-flex tw-items-center tw-gap-3">
        <div className="tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="tw-h-5 tw-w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </div>
        <div className="tw-text-sm tw-text-blue-100/80">
          <span className="tw-font-semibold">xTDH Beta:</span> This feature is
          currently in test/demo mode. All data will be reset after the test
          period. Please test it out and give us feedback!
        </div>
      </div>
    </div>
  );
}
