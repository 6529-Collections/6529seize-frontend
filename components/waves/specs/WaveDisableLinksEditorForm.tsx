import WaveSettingEditorActions from "./WaveSettingEditorActions";

interface WaveDisableLinksEditorFormProps {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onCancel: () => void;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly onSave: () => void;
}

export default function WaveDisableLinksEditorForm({
  checked,
  disabled,
  onCancel,
  onCheckedChange,
  onSave,
}: WaveDisableLinksEditorFormProps) {
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
          aria-label="Disable links"
          autoFocus
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="tw-mt-0.5 tw-h-4 tw-w-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        />
        <span>Disable links</span>
      </label>

      <WaveSettingEditorActions disabled={disabled} onCancel={onCancel} />
    </form>
  );
}
