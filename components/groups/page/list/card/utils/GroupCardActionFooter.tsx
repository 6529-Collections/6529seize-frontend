import Button from "@/components/utils/button/Button";

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
        <Button
          onClick={onCancel}
          variant="secondary"
          size="md"
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          loading={loading}
          disabled={disabled}
          variant="action"
          size="md"
        >
          Grant
        </Button>
      </div>
    </div>
  );
}
