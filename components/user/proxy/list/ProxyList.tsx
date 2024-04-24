import { ProxyMode } from "../UserPageProxy";

export default function ProxyList({
  onModeChange,
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onModeChange(ProxyMode.CREATE)}
        className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-w-5 tw-h-5 tw-mr-2 -tw-ml-1"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Create new</span>
      </button>
    </div>
  );
}
