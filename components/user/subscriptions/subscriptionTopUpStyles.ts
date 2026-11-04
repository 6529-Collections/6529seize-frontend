export const TOP_UP_RADIO_CLASS =
  "tw-relative tw-m-0 tw-size-4 tw-shrink-0 tw-cursor-pointer tw-appearance-none tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-transition-colors tw-duration-300 tw-ease-out after:tw-absolute after:tw-left-1/2 after:tw-top-1/2 after:tw-size-2 after:-tw-translate-x-1/2 after:-tw-translate-y-1/2 after:tw-scale-50 after:tw-rounded-full after:tw-bg-primary-500 after:tw-opacity-0 after:tw-transition-[transform,opacity] after:tw-duration-300 after:tw-ease-out after:tw-content-[''] checked:tw-border-primary-500 checked:tw-bg-primary-500/10 checked:after:tw-scale-100 checked:after:tw-opacity-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 desktop-hover:hover:tw-border-iron-500 motion-reduce:tw-transition-none motion-reduce:after:tw-transition-none";

export function getTopUpOptionClass(selected: boolean): string {
  const stateClass = selected
    ? "tw-bg-primary-500/15 tw-ring-primary-400/60 desktop-hover:hover:tw-bg-primary-500/20"
    : "tw-bg-iron-950 tw-ring-white/[0.03] desktop-hover:hover:tw-bg-primary-500/[0.06] desktop-hover:hover:tw-ring-primary-400/30";

  return `tw-relative tw-block tw-min-h-[104px] tw-rounded-xl tw-px-4 tw-py-3 tw-text-left tw-shadow-lg tw-ring-1 tw-ring-inset tw-transition-[background-color,box-shadow] tw-duration-500 tw-ease-out motion-reduce:tw-transition-none desktop-hover:hover:tw-shadow-2xl desktop-hover:hover:tw-shadow-black/50 ${stateClass}`;
}
