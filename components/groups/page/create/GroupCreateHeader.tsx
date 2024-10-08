export default function GroupCreateHeader() {
  return (
    <div className="tw-inline-flex tw-items-center tw-space-x-3 sm:tw-space-x-4">
      <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-10 tw-w-10 sm:tw-h-11 sm:tw-w-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700">
        <svg
          className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 tw-size-5 sm:tw-size-6"
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
      <p className="tw-mb-0 tw-text-xl sm:tw-text-2xl tw-font-semibold tw-text-iron-50">
        Group configuration
      </p>
    </div>
  );
}
