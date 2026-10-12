import type { ReactNode } from "react";

function getActionButtonStateClasses({
  active,
  quiet,
}: {
  readonly active: boolean;
  readonly quiet: boolean;
}) {
  if (quiet) {
    return active
      ? "tw-border-primary-400/40 tw-bg-primary-500/10 tw-text-primary-200 desktop-hover:hover:tw-border-primary-400/70 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-100"
      : "tw-border-iron-700 tw-bg-iron-900/60 tw-text-iron-200 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800";
  }

  return active
    ? "tw-border-primary-500/70 tw-bg-transparent tw-text-primary-400 desktop-hover:hover:tw-border-primary-400 desktop-hover:hover:tw-bg-primary-500/5 desktop-hover:hover:tw-text-primary-300"
    : "tw-border-transparent tw-bg-iron-800 tw-text-iron-200 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white";
}

function getCompactActionButtonStateClasses(active: boolean) {
  return active
    ? "tw-text-primary-200 before:tw-border-primary-400/40 before:tw-bg-primary-500/10 desktop-hover:hover:before:tw-border-primary-400/70 desktop-hover:hover:before:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-100"
    : "tw-text-iron-200 before:tw-border-iron-700 before:tw-bg-iron-900/60 desktop-hover:hover:before:tw-border-iron-600 desktop-hover:hover:before:tw-bg-iron-800 desktop-hover:hover:tw-text-white";
}

export function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  isToggle = false,
  quiet = false,
  compactVisual = false,
}: {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly isToggle?: boolean | undefined;
  readonly quiet?: boolean;
  readonly compactVisual?: boolean;
}) {
  const stateClasses = getActionButtonStateClasses({ active, quiet });

  if (quiet && compactVisual) {
    const compactVisualStateClasses =
      getCompactActionButtonStateClasses(active);

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={isToggle ? active : undefined}
        className={`tw-relative tw-isolate tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-0 tw-text-xs tw-font-medium tw-transition tw-duration-200 before:tw-pointer-events-none before:tw-absolute before:tw-inset-x-0 before:tw-inset-y-1.5 before:-tw-z-10 before:tw-rounded-md before:tw-border before:tw-border-solid before:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${compactVisualStateClasses}`}
      >
        {icon}
        {label}
      </button>
    );
  }

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
