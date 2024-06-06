import GroupCreate from "./create/GroupCreate";
import GroupsList from "./list/GroupsList";

export default function Groups() {
  // return <GroupCreate />;
  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <h1 className="tw-float-none">Groups</h1>
        <button
          type="button"
          className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-size-5 tw-mr-2 -tw-ml-1 tw-flex-shrink-0"
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
          <span>Create New</span>
        </button>
      </div>
      <div className="tw-mt-8 tw-grid tw-grid-cols-2 tw-gap-8">
        <GroupsList />
      </div>
    </div>
  );
}
