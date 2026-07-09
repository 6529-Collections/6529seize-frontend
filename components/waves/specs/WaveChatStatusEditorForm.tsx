import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import WaveSettingEditorActions from "./WaveSettingEditorActions";

interface WaveChatStatusEditorFormProps {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onCancel: () => void;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly onSave: () => void;
}

export default function WaveChatStatusEditorForm({
  checked,
  disabled,
  onCancel,
  onCheckedChange,
  onSave,
}: WaveChatStatusEditorFormProps) {
  const enableChatLabel = t(
    DEFAULT_LOCALE,
    "waves.chatSettings.status.enableLabel"
  );

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
          aria-label={enableChatLabel}
          autoFocus
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="tw-mt-0.5 tw-h-4 tw-w-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        />
        <span>{enableChatLabel}</span>
      </label>
      <p className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500">
        {t(DEFAULT_LOCALE, "waves.chatSettings.status.enableHelp")}
      </p>

      <WaveSettingEditorActions disabled={disabled} onCancel={onCancel} />
    </form>
  );
}
