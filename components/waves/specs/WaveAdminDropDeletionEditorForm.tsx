import { useId } from "react";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import WaveSettingEditorActions from "./WaveSettingEditorActions";

interface WaveAdminDropDeletionEditorFormProps {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onCancel: () => void;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly onSave: () => void;
}

export default function WaveAdminDropDeletionEditorForm({
  checked,
  disabled,
  onCancel,
  onCheckedChange,
  onSave,
}: WaveAdminDropDeletionEditorFormProps) {
  const descriptionId = useId();
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <label className="tw-flex tw-cursor-pointer tw-items-start tw-gap-2 tw-text-sm tw-text-iron-100">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="tw-form-checkbox tw-mt-0.5 tw-h-4 tw-w-4 tw-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400 focus:tw-ring-offset-0 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        />
        <span>
          {waveRightPanelText(
            "waves.sidebar.rightPanel.configuration.adminDropDeletion.editorLabel"
          )}
        </span>
      </label>
      <p
        id={descriptionId}
        className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
      >
        {waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.adminDropDeletion.description"
        )}
      </p>

      <WaveSettingEditorActions disabled={disabled} onCancel={onCancel} />
    </form>
  );
}
