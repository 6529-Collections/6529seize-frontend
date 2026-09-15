import type { ReactNode } from "react";

export function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  isToggle = false,
  quiet = false,
}: {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly isToggle?: boolean | undefined;
  readonly quiet?: boolean;
}) {
  const stateClasses = quiet
    ? active
      ? "tw-border-primary-400/40 tw-bg-primary-500/10 tw-text-primary-200 desktop-hover:hover:tw-border-primary-400/70 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-100"
      : "tw-border-iron-700 tw-bg-iron-900/60 tw-text-iron-200 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800"
    : active
      ? "tw-border-primary-500/70 tw-bg-transparent tw-text-primary-400 desktop-hover:hover:tw-border-primary-400 desktop-hover:hover:tw-bg-primary-500/5 desktop-hover:hover:tw-text-primary-300"
      : "tw-border-transparent tw-bg-iron-800 tw-text-iron-200 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isToggle ? active : undefined}
      className={`tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${quiet ? "tw-min-h-11 tw-text-sm" : ""} ${stateClasses}`}
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
  configured = false,
  configuredLabel,
  prominent = false,
  isToggle = false,
  quiet = false,
  quietStyle = "tab",
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly compact?: boolean | undefined;
  readonly configured?: boolean | undefined;
  readonly configuredLabel?: string | undefined;
  readonly prominent?: boolean | undefined;
  readonly isToggle?: boolean | undefined;
  readonly quiet?: boolean;
  readonly quietStyle?: "tab" | "segment";
}) {
  let stateClasses = prominent
    ? "tw-border-white/15 tw-bg-iron-900 tw-text-iron-100 tw-shadow-sm tw-shadow-black/20 desktop-hover:hover:tw-border-primary-400/50 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white"
    : "tw-border-white/5 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100";
  if (active && prominent) {
    stateClasses =
      "tw-border-primary-300 tw-bg-primary-600 tw-text-white tw-underline tw-decoration-2 tw-underline-offset-4 tw-shadow-sm tw-shadow-black/20 desktop-hover:hover:tw-border-primary-300 desktop-hover:hover:tw-bg-primary-500";
  } else if (active) {
    stateClasses =
      "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-400 desktop-hover:hover:tw-border-primary-400/70 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-300";
  } else if (configured) {
    stateClasses =
      "tw-border-primary-400/60 tw-bg-primary-500/10 tw-text-primary-200 tw-shadow-sm tw-shadow-primary-950/20 desktop-hover:hover:tw-border-primary-300 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-100";
  }
  let sizeClasses = "tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium";
  if (prominent) {
    sizeClasses = "tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold";
  } else if (compact) {
    sizeClasses = "tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium";
  }
  const configuredIndicatorClasses = quiet
    ? "tw-bg-primary-300"
    : active && prominent
      ? "tw-bg-white tw-shadow-[0_0_0_3px_rgba(255,255,255,0.18)]"
      : "tw-bg-primary-300 tw-shadow-[0_0_0_3px_rgba(89,124,255,0.14)]";

  if (quiet) {
    if (quietStyle === "segment") {
      sizeClasses = "tw-min-h-11 tw-px-3 tw-py-2 tw-text-xs tw-font-medium";
      stateClasses = active
        ? "tw-border-transparent tw-bg-iron-700 tw-text-iron-50"
        : "tw-border-transparent tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-100";
    } else {
      sizeClasses = "tw-min-h-11 tw-px-2 tw-py-2 tw-text-[13px] tw-font-medium";
      stateClasses = active
        ? "tw-border-primary-400 tw-bg-transparent tw-text-primary-100 desktop-hover:hover:tw-text-white"
        : configured
          ? "tw-border-transparent tw-bg-transparent tw-text-iron-100 desktop-hover:hover:tw-text-white"
          : "tw-border-transparent tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-100";
    }
  }
  const shapeClasses = quiet
    ? quietStyle === "segment"
      ? "tw-rounded-md tw-border"
      : "tw-rounded-none tw-border-x-0 tw-border-t-0 tw-border-b-2"
    : "tw-rounded-lg tw-border";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isToggle ? active : undefined}
      aria-label={
        configured && configuredLabel
          ? `${label}, ${configuredLabel}`
          : undefined
      }
      data-configured={configured ? true : undefined}
      className={`${shapeClasses} tw-border-solid tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${sizeClasses} ${stateClasses}`}
    >
      {configured ? (
        <span
          aria-hidden="true"
          className={`tw-mr-2 tw-inline-block tw-size-1.5 tw-rounded-full ${configuredIndicatorClasses}`}
        />
      ) : null}
      {label}
    </button>
  );
}
