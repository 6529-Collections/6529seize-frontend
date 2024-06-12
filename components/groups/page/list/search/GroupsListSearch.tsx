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
    <div className="tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row tw-w-full md:tw-w-2/3 xl:tw-w-1/2 xl:tw-pr-3 tw-gap-4">
      <IdentitySearch identity={identity} setIdentity={setIdentity} />
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
  );
}
