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
        className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-h-5 tw-w-5 tw-text-iron-300"
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
        placeholder=" "
        className="tw-pb-3 tw-pt-3 tw-form-input tw-block tw-w-full tw-text-sm tw-rounded-lg tw-border-0 tw-appearance-none tw-font-medium tw-border-iron-650 focus:tw-border-blue-500 tw-peer tw-pl-10 tw-pr-4 tw-bg-iron-900 focus:tw-bg-iron-900  tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
      />
      <label
        htmlFor="search-group-name"
        className="tw-text-sm tw-absolute tw-cursor-text tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-origin-[0] tw-bg-iron-900 tw-rounded-lg peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
        peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
      >
        Search by group name
      </label>
    </div>
  );
}
