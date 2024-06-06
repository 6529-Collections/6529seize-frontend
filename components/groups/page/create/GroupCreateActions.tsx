export default function GroupCreateActions() {
  return (
    <div className="tw-px-8 tw-pt-6 tw-mt-6 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-700">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-end">
        {/* COMPONENDIKS - SECONDARYBUTTON */}
        <button
          type="button"
          className="tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        {/* COMPONENDIKS - PRIMARYBUTTON */}
        <button
          type="button"
          className="tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-bg-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Create
        </button>
      </div>
    </div>
  );
}