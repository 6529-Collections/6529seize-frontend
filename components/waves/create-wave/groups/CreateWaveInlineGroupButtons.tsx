import type { ReactNode } from "react";

type QuietStyle = "tab" | "segment";

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

function getDefaultDraftChipStateClasses({
  active,
  configured,
  prominent,
}: {
  readonly active: boolean;
  readonly configured: boolean;
  readonly prominent: boolean;
}) {
  if (active && prominent) {
    return "tw-border-primary-300 tw-bg-primary-600 tw-text-white tw-underline tw-decoration-2 tw-underline-offset-4 tw-shadow-sm tw-shadow-black/20 desktop-hover:hover:tw-border-primary-300 desktop-hover:hover:tw-bg-primary-500";
  }
  if (active) {
    return "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-400 desktop-hover:hover:tw-border-primary-400/70 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-300";
  }
  if (configured) {
    return "tw-border-primary-400/60 tw-bg-primary-500/10 tw-text-primary-200 tw-shadow-sm tw-shadow-primary-950/20 desktop-hover:hover:tw-border-primary-300 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-100";
  }
  if (prominent) {
    return "tw-border-white/15 tw-bg-iron-900 tw-text-iron-100 tw-shadow-sm tw-shadow-black/20 desktop-hover:hover:tw-border-primary-400/50 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white";
  }
  return "tw-border-white/5 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100";
}

function getDefaultDraftChipSizeClasses({
  compact,
  prominent,
}: {
  readonly compact: boolean;
  readonly prominent: boolean;
}) {
  if (prominent) {
    return "tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold";
  }
  if (compact) {
    return "tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium";
  }
  return "tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium";
}

function getQuietDraftChipClasses({
  active,
  configured,
  quietStyle,
}: {
  readonly active: boolean;
  readonly configured: boolean;
  readonly quietStyle: QuietStyle;
}) {
  if (quietStyle === "segment") {
    return {
      shape:
        "tw-relative tw-isolate tw-rounded-md tw-border-0 before:tw-pointer-events-none before:tw-absolute before:-tw-z-10 before:tw-inset-x-0 before:tw-inset-y-1.5 before:tw-rounded-md before:tw-content-['']",
      size: "tw-min-h-11 tw-px-3 tw-py-0 tw-text-xs tw-font-medium",
      state: active
        ? "tw-bg-transparent tw-text-iron-50 before:tw-bg-iron-700"
        : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:before:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100",
    };
  }

  const tabHoverClasses =
    "desktop-hover:hover:tw-border-primary-400/60 desktop-hover:hover:tw-bg-primary-500/5 desktop-hover:hover:tw-text-primary-100";
  let state = `tw-border-transparent tw-bg-transparent tw-text-iron-400 ${tabHoverClasses}`;
  if (configured) {
    state = `tw-border-transparent tw-bg-transparent tw-text-iron-300 ${tabHoverClasses}`;
  }
  if (active) {
    state =
      "tw-border-primary-400 tw-bg-transparent tw-text-primary-100 desktop-hover:hover:tw-bg-primary-500/5 desktop-hover:hover:tw-text-white";
  }

  return {
    shape: "tw-rounded-none tw-border-x-0 tw-border-t-0 tw-border-b-2",
    size: "tw-min-h-11 tw-px-2 tw-py-2 tw-text-[13px] tw-font-medium",
    state,
  };
}

function getConfiguredIndicatorClasses({
  active,
  prominent,
  quiet,
}: {
  readonly active: boolean;
  readonly prominent: boolean;
  readonly quiet: boolean;
}) {
  if (quiet) {
    return "tw-bg-primary-300";
  }
  return active && prominent
    ? "tw-bg-white tw-shadow-[0_0_0_3px_rgba(255,255,255,0.18)]"
    : "tw-bg-primary-300 tw-shadow-[0_0_0_3px_rgba(89,124,255,0.14)]";
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
        className={`tw-relative tw-isolate tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-0 tw-text-xs tw-font-medium tw-transition tw-duration-200 before:tw-pointer-events-none before:tw-absolute before:-tw-z-10 before:tw-inset-x-0 before:tw-inset-y-1.5 before:tw-rounded-md before:tw-border before:tw-border-solid before:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${compactVisualStateClasses}`}
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
  readonly quietStyle?: QuietStyle;
}) {
  let stateClasses = getDefaultDraftChipStateClasses({
    active,
    configured,
    prominent,
  });
  let sizeClasses = getDefaultDraftChipSizeClasses({ compact, prominent });
  let shapeClasses = "tw-rounded-lg tw-border";
  if (quiet) {
    const quietClasses = getQuietDraftChipClasses({
      active,
      configured,
      quietStyle,
    });
    stateClasses = quietClasses.state;
    sizeClasses = quietClasses.size;
    shapeClasses = quietClasses.shape;
  }
  const configuredIndicatorClasses = getConfiguredIndicatorClasses({
    active,
    prominent,
    quiet,
  });

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
