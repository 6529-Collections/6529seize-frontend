import UserPageBadgeSelector from "./UserPageBadgeSelector";

export default function UserPageBadgeAdd() {
  return (
    <div>
      <button
        type="button"
        title="Add new"
        className="tw-inline-flex tw-items-center tw-justify-center tw-bg-white tw-w-6 tw-h-6 tw-border tw-border-solid tw-border-white tw-rounded-[1px] hover:tw-bg-neutral-200 hover:tw-border-neutral-200 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-h-4 w-w-4 tw-flex-shrink-0 tw-text-neutral-900"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <UserPageBadgeSelector />
    </div>
  );
}
