import PrimaryButton from "@/components/utils/button/PrimaryButton";

export default function GroupCardActionFooter({
  loading,
  disabled,
  onSave,
  onCancel,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <div className="tw-mt-auto tw-border-t tw-border-white/10 tw-pt-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="tw-inline-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-ring-1 tw-ring-iron-700 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700"
        >
          Cancel
        </button>
        <PrimaryButton loading={loading} disabled={disabled} onClicked={onSave}>
          Grant
        </PrimaryButton>
      </div>
    </div>
  );
}
