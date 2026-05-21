interface WaveSettingEditorActionsProps {
  readonly disabled: boolean;
  readonly secondaryAction?: {
    readonly disabled: boolean;
    readonly label: string;
    readonly onClick: () => void;
  } | null;
  readonly onCancel: () => void;
}

export default function WaveSettingEditorActions({
  disabled,
  onCancel,
  secondaryAction = null,
}: WaveSettingEditorActionsProps) {
  return (
    <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onCancel}
        className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-100"
      >
        Cancel
      </button>
      {secondaryAction && (
        <button
          type="button"
          disabled={disabled || secondaryAction.disabled}
          onClick={secondaryAction.onClick}
          className="tw-rounded-md tw-border tw-border-solid tw-border-red/40 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-red tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-red desktop-hover:hover:tw-text-red"
        >
          {secondaryAction.label}
        </button>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="tw-rounded-md tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600"
      >
        Save
      </button>
    </div>
  );
}
