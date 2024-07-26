import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import IdentitySearch, { IdentitySearchSize } from "../../../../utils/input/identity/IdentitySearch";

export default function GroupsListSearch({
  identity,
  groupName,
  showIdentitySearch,
  showCreateNewGroupButton,
  showMyGroupsButton,
  setIdentity,
  setGroupName,
  onCreateNewGroup,
  onMyGroups,
}: {
  readonly identity: string | null;
  readonly groupName: string | null;
  readonly showIdentitySearch: boolean;
  readonly showCreateNewGroupButton: boolean;
  readonly showMyGroupsButton: boolean;
  readonly setIdentity: (identity: string | null) => void;
  readonly setGroupName: (groupName: string | null) => void;
  readonly onCreateNewGroup: () => void;
  readonly onMyGroups: () => void;
}) {
  const randomId = getRandomObjectId();
  const onGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
  };

  return (
    <div className="tw-mt-4 tw-flex tw-flex-col md:tw-flex-row tw-w-full md:tw-items-center tw-justify-between tw-gap-4">
      <div className="tw-flex tw-flex-col tw-w-full sm:tw-flex-row tw-items-center tw-gap-4 xl:tw-w-1/2 xl:tw-pr-3">
        {showIdentitySearch && (
          <IdentitySearch
            size={IdentitySearchSize.SM}
            identity={identity}
            setIdentity={setIdentity}
            label="By Identity"
          />
        )}
        <div className="tw-group tw-w-full tw-relative">
          <input
            type="text"
            value={groupName ?? ""}
            onChange={onGroupNameChange}
            id={randomId}
            autoComplete="off"
            className="tw-pb-3 tw-pt-3 tw-text-md tw-form-input tw-block tw-pl-10 tw-pr-4 tw-w-full tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            placeholder=" "
          />
          <svg
            className={`tw-top-3.5 tw-pointer-events-none tw-absolute tw-left-3 tw-h-5 tw-w-5 tw-text-iron-300`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            ></path>
          </svg>
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
            className="tw-text-md tw-absolute tw-cursor-text tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
        peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            By Group Name
          </label>
        </div>
      </div>
      <div className="tw-flex tw-gap-x-3">
        {showMyGroupsButton && (
          <button
            onClick={onMyGroups}
            type="button"
            className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
          >
            My groups
          </button>
        )}
        {showCreateNewGroupButton && (
          <button
            onClick={onCreateNewGroup}
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
        )}
      </div>
    </div>
  );
}
