const DARK_AUTOFILL_CLASSES =
  "[&:-webkit-autofill]:[-webkit-text-fill-color:theme(colors.iron.100)] [&:-webkit-autofill]:[caret-color:theme(colors.iron.100)] [&:-webkit-autofill]:tw-shadow-[inset_0_0_0px_1000px_theme(colors.iron.900)] [&:-webkit-autofill:hover]:[-webkit-text-fill-color:theme(colors.iron.100)] [&:-webkit-autofill:hover]:[caret-color:theme(colors.iron.100)] [&:-webkit-autofill:hover]:tw-shadow-[inset_0_0_0px_1000px_theme(colors.iron.900)] [&:-webkit-autofill:focus]:[-webkit-text-fill-color:theme(colors.iron.100)] [&:-webkit-autofill:focus]:[caret-color:theme(colors.iron.100)] [&:-webkit-autofill:focus]:tw-shadow-[inset_0_0_0px_1000px_theme(colors.iron.900)]";

export default function SelectGroupModalSearchName({
  filterName,
  setFilterName,
}: {
  readonly filterName: string | null;
  readonly setFilterName: (name: string | null) => void;
}) {
  return (
    <div className="tw-relative">
      <svg
        className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-4 tw-w-4 tw-text-iron-300"
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
      <input
        value={filterName ?? ""}
        onChange={(e) => setFilterName(e.target.value)}
        type="text"
        id="search-group-name"
        autoComplete="off"
        placeholder=" "
        className={`tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-pb-3 tw-pl-9 tw-pr-4 tw-pt-3 tw-text-sm tw-font-medium tw-text-iron-100 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 ${DARK_AUTOFILL_CLASSES}`}
      />
      <label
        htmlFor="search-group-name"
        className="tw-absolute tw-start-1 tw-top-2 tw-ml-6 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
      >
        Search by group name
      </label>
    </div>
  );
}
