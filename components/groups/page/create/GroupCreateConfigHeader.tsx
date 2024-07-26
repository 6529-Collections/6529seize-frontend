export default function GroupCreateConfigHeader() {
  return (
    <div className="tw-inline-flex tw-items-center tw-space-x-4">
      <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700">
        <svg
          className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 tw-size-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          />
        </svg>
      </span>
      <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        Types
      </p>
    </div>
  );
}