import { GROUP_CREATE_PANEL_STYLES } from "./GroupCreate.styles";

export default function GroupCreateName({
  name,
  setName,
}: {
  readonly name: string;
  readonly setName: (name: string) => void;
}) {
  return (
    <div className={GROUP_CREATE_PANEL_STYLES}>
      <div className="tw-group tw-relative tw-w-full">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          id="floating_name"
          autoComplete="off"
          className="tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-3 tw-text-md tw-font-medium tw-text-white tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
          placeholder=" "
        />
        <label
          htmlFor="floating_name"
          className="tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-md tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
        >
          Name
        </label>
      </div>
    </div>
  );
}
