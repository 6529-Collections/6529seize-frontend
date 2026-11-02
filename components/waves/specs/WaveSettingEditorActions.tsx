import Button from "@/components/utils/button/Button";
import { useContext } from "react";
import { WaveSettingEditorContext } from "./WaveSettingEditorContext";

interface WaveSettingEditorActionsProps {
  readonly disabled: boolean;
  readonly secondaryAction?: {
    readonly disabled: boolean;
    readonly label: string;
    readonly onClick: () => void;
    readonly variant?: "danger" | "neutral" | undefined;
  } | null;
  readonly onCancel: () => void;
  readonly onSubmit?: (() => void) | undefined;
  readonly submitDisabled?: boolean | undefined;
}

export default function WaveSettingEditorActions({
  disabled,
  onCancel,
  onSubmit,
  secondaryAction = null,
  submitDisabled = false,
}: WaveSettingEditorActionsProps) {
  const surface = useContext(WaveSettingEditorContext);
  return (
    <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
      {surface === "popover" && (
        <Button
          disabled={disabled}
          onClick={onCancel}
          variant="tertiary"
          size="xs"
        >
          Cancel
        </Button>
      )}
      {secondaryAction && (
        <Button
          disabled={disabled || secondaryAction.disabled}
          onClick={secondaryAction.onClick}
          variant={
            secondaryAction.variant === "neutral" ? "secondary" : "destructive"
          }
          size="xs"
        >
          {secondaryAction.label}
        </Button>
      )}
      <Button
        type={onSubmit ? "button" : "submit"}
        disabled={disabled || submitDisabled}
        onClick={onSubmit}
        variant="action"
        size="xs"
      >
        Save
      </Button>
    </div>
  );
}
