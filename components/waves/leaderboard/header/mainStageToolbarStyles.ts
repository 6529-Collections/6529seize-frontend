export const MAIN_STAGE_TABLIST_CLASS_NAME =
  "tw-box-border tw-flex tw-h-[38px] tw-flex-shrink-0 tw-items-center tw-gap-0.5 tw-whitespace-nowrap tw-rounded-lg tw-bg-iron-950 tw-p-[3px] tw-ring-1 tw-ring-inset tw-ring-white/[0.07]";

export function getMainStageTabClassName(selected: boolean): string {
  const baseClassName =
    "tw-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-1 focus-visible:tw-ring-offset-iron-950 motion-reduce:tw-transition-none";
  const stateClassName = selected
    ? "tw-bg-iron-800 tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-white/[0.05]"
    : "tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-bg-iron-800/60 desktop-hover:hover:tw-text-iron-300";
  return `${baseClassName} ${stateClassName}`;
}
