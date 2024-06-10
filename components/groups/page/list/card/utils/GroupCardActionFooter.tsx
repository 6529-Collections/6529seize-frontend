export default function GroupCardActionFooter({
  onCancel,
}: {
  readonly onCancel: () => void;
}) {
  return (
    <div className="tw-pt-3 tw-px-4 sm:tw-px-6 tw-mt-auto">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        <button
          type="button"
          className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Save
        </button>
      </div>
    </div>
  );
}
