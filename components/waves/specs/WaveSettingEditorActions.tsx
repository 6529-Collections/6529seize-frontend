import Button from "@/components/utils/button/Button";

interface WaveSettingEditorActionsProps {
  readonly disabled: boolean;
  readonly secondaryAction?: {
    readonly disabled: boolean;
    readonly label: string;
    readonly onClick: () => void;
    readonly variant?: "danger" | "neutral" | undefined;
  } | null;
  readonly onCancel: () => void;
  readonly submitDisabled?: boolean | undefined;
}

export default function WaveSettingEditorActions({
  disabled,
  onCancel,
  secondaryAction = null,
  submitDisabled = false,
}: WaveSettingEditorActionsProps) {
  return (
    <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
      <Button
        disabled={disabled}
        onClick={onCancel}
        variant="tertiary"
        size="xs"
      >
        Cancel
      </Button>
      {secondaryAction && (
        <Button
          disabled={disabled || secondaryAction.disabled}
          onClick={secondaryAction.onClick}
          variant={
            secondaryAction.variant === "neutral"
              ? "secondary"
              : "destructive"
          }
          size="xs"
        >
          {secondaryAction.label}
        </Button>
      )}
      <Button
        type="submit"
        disabled={disabled || submitDisabled}
        variant="action"
        size="xs"
      >
        Save
      </Button>
    </div>
  );
}
