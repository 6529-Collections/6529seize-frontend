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
  const onGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
  };
  return (
    <div className="tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row tw-w-full md:tw-w-2/3 xl:tw-w-1/2 tw-pr-3 tw-gap-4">
      <IdentitySearch identity={identity} setIdentity={setIdentity} />
      <div className="tw-group tw-w-full tw-relative">
        <input
          type="text"
          value={groupName ?? ""}
          onChange={onGroupNameChange}
          id="floating_group_name"
          autoComplete="off"
          className="tw-form-input tw-block tw-px-4 tw-py-3 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
          placeholder=" "
        />
        <label
          htmlFor="floating_group_name"
          className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-3 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 
          peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
        >
          Group Name
        </label>
      </div>
    </div>
  );
}
