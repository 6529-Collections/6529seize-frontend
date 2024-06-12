import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import IdentitySearch from "../../../../utils/input/identity/IdentitySearch";

export default function GroupsListSearch({
  identity,
  groupName,
  setIdentity,
  setGroupName,
}: {
  readonly identity: string | null;
  readonly groupName: string | null;
  readonly setIdentity: (identity: string | null) => void;
  readonly setGroupName: (groupName: string | null) => void;
}) {
  const randomId = getRandomObjectId();
  const onGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
  };

  return (
    <div className="tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row tw-w-full tw-items-center tw-justify-between tw-gap-4">
      <div className="tw-flex tw-items-center tw-gap-4 tw-w-1/2 xl:tw-pr-3">
        <IdentitySearch
          identity={identity}
          setIdentity={setIdentity}
          label="By Identity"
        />
        <div className="tw-group tw-w-full tw-relative">
          <input
            type="text"
            value={groupName ?? ""}
            onChange={onGroupNameChange}
            id={randomId}
            autoComplete="off"
            className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-3 tw-w-full tw-text-md tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            placeholder=" "
          />
          {!!groupName?.length && (
            <svg
              onClick={() => setGroupName(null)}
              className="tw-top-3.5 tw-cursor-pointer tw-absolute tw-right-3 tw-h-5 tw-w-5 tw-text-iron-300"
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
          )}
          <label
            htmlFor={randomId}
            className="tw-absolute tw-cursor-text tw-text-md tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-3 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 
          peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            By Group Name
          </label>
        </div>
      </div>
      <button
        type="button"
        className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
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
  );
}
