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
          className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-white/12 tw-bg-white/5 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-shadow-sm tw-shadow-black/15 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500"
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
