import { useId } from "react";
import type { WaveChatRepliesSettings } from "@/helpers/waves/wave-chat-replies.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import WaveSettingEditorActions from "./WaveSettingEditorActions";

interface WaveChatRepliesEditorFormProps {
  readonly settings: WaveChatRepliesSettings;
  readonly disabled: boolean;
  readonly onCancel: () => void;
  readonly onSettingsChange: (settings: WaveChatRepliesSettings) => void;
  readonly onSave: () => void;
}

const CHECKBOX_CLASS_NAME =
  "tw-form-checkbox tw-mt-0.5 tw-h-4 tw-w-4 tw-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400 focus:tw-ring-offset-0 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";

function ReplySettingCheckbox({
  checked,
  description,
  disabled,
  label,
  onCheckedChange,
}: {
  readonly checked: boolean;
  readonly description: string;
  readonly disabled: boolean;
  readonly label: string;
  readonly onCheckedChange: (checked: boolean) => void;
}) {
  const inputId = useId();
  const descriptionId = useId();
  return (
    <div className="tw-flex tw-items-start tw-gap-2">
      <input
        id={inputId}
        type="checkbox"
        aria-describedby={descriptionId}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className={CHECKBOX_CLASS_NAME}
      />
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <label
          htmlFor={inputId}
          className="tw-cursor-pointer tw-text-sm tw-text-iron-100"
        >
          {label}
        </label>
        <span id={descriptionId} className="tw-text-xs tw-text-iron-400">
          {description}
        </span>
      </div>
    </div>
  );
}

export default function WaveChatRepliesEditorForm({
  settings,
  disabled,
  onCancel,
  onSettingsChange,
  onSave,
}: WaveChatRepliesEditorFormProps) {
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <ReplySettingCheckbox
        checked={settings.open}
        disabled={disabled}
        label={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.chat.replies.openLabel"
        )}
        description={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.chat.replies.openDescription"
        )}
        onCheckedChange={(open) => onSettingsChange({ ...settings, open })}
      />
      <ReplySettingCheckbox
        checked={settings.collapsed}
        disabled={disabled}
        label={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.chat.replies.collapsedLabel"
        )}
        description={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.chat.replies.collapsedDescription"
        )}
        onCheckedChange={(collapsed) =>
          onSettingsChange({ ...settings, collapsed })
        }
      />

      <WaveSettingEditorActions disabled={disabled} onCancel={onCancel} />
    </form>
  );
}
