export function ActionButton({
  label,
  onClick,
  disabled = false,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800"
    >
      {label}
    </button>
  );
}

export function DraftChipButton({
  label,
  onClick,
  disabled = false,
  active = false,
  compact = false,
  isToggle = false,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly compact?: boolean | undefined;
  readonly isToggle?: boolean | undefined;
}) {
  const stateClasses = active
    ? "tw-border-primary-400 tw-bg-primary-500/15 tw-text-primary-200 desktop-hover:hover:tw-border-primary-300 desktop-hover:hover:tw-bg-primary-500/20"
    : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-200 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800";
  const sizeClasses = compact
    ? "tw-px-2.5 tw-py-1 tw-text-xs"
    : "tw-px-3 tw-py-1.5 tw-text-xs";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isToggle ? active : undefined}
      className={`tw-rounded-lg tw-border tw-border-solid tw-font-semibold tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${sizeClasses} ${stateClasses}`}
    >
      {label}
    </button>
  );
}
