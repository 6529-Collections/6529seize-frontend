import type { ReactNode } from "react";

export function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  isToggle = false,
}: {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly isToggle?: boolean | undefined;
}) {
  const stateClasses = active
    ? "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-400 desktop-hover:hover:tw-border-primary-400/70 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-300"
    : "tw-border-white/5 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isToggle ? active : undefined}
      className={`tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${stateClasses}`}
    >
      {icon}
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
  let stateClasses =
    "tw-border-white/5 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100";
  if (active) {
    stateClasses =
      "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-400 desktop-hover:hover:tw-border-primary-400/70 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-300";
  }
  const sizeClasses = compact
    ? "tw-px-2.5 tw-py-1 tw-text-xs"
    : "tw-px-3 tw-py-1.5 tw-text-xs";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isToggle ? active : undefined}
      className={`tw-rounded-lg tw-border tw-border-solid tw-font-medium tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${sizeClasses} ${stateClasses}`}
    >
      {label}
    </button>
  );
}
