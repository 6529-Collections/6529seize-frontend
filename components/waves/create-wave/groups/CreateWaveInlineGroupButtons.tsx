export function ActionButton({
  label,
  onClick,
  disabled = false,
  active = false,
  isToggle = false,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly isToggle?: boolean | undefined;
}) {
  const stateClasses = active
    ? "tw-border-primary-400/70 tw-bg-primary-500/10 tw-text-primary-100 tw-shadow-[inset_0_0_0_1px_rgba(80,114,245,0.12)] desktop-hover:hover:tw-border-primary-300/80 desktop-hover:hover:tw-bg-primary-500/15"
    : "tw-border-white/10 tw-bg-iron-950/70 tw-text-iron-300 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-iron-900/80 desktop-hover:hover:tw-text-iron-100";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isToggle ? active : undefined}
      className={`tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2.5 tw-text-xs tw-font-semibold tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${stateClasses}`}
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
    ? "tw-border-primary-400/70 tw-bg-primary-500/10 tw-text-primary-100 desktop-hover:hover:tw-border-primary-300/80 desktop-hover:hover:tw-bg-primary-500/15"
    : "tw-border-white/10 tw-bg-iron-950/70 tw-text-iron-300 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-iron-900/80 desktop-hover:hover:tw-text-iron-100";
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
