export default function GroupHeaderBuild({ onView }: { readonly onView: () => void }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
    >
      <svg
        className="tw-flex-shrink-0 tw-w-5 tw-h-5"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 12H4M4 12L10 18M4 12L10 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Back to list</span>
    </button>
  );
}
