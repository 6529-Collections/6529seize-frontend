export const CREATE_WAVE_FORM_STYLES = {
  stepTitle: "tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-white",
  stepDescription:
    "tw-m-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300",
  sectionTitle:
    "tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100",
  fieldLabel:
    "tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100",
  supportingText:
    "tw-m-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400",
  compactSupportingText:
    "tw-m-0 tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-400",
} as const;

export const CREATE_WAVE_OPTION_STYLES = {
  grid: "tw-grid tw-grid-cols-1 tw-gap-3",
  card: "tw-group tw-grid tw-min-w-0 tw-grid-cols-1 tw-items-center tw-gap-3 tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-3 tw-transition-colors focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 motion-reduce:tw-transition-none sm:tw-grid-cols-[72px_minmax(0,1fr)] sm:tw-gap-4",
  selected: "tw-border-primary-500/60 tw-bg-primary-500/5",
  unselected: "tw-border-white/5 tw-bg-iron-950 hover:tw-border-white/10",
  preview:
    "tw-h-16 tw-w-full tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-2 sm:tw-h-14",
  // Contain the sr-only radio so focusing it cannot scroll an outer layout.
  content: "tw-relative tw-flex tw-min-w-0 tw-items-center tw-gap-4",
} as const;

export const CREATE_WAVE_FORM_CONTROL_SCOPE_STYLES =
  "[&_input]:tw-text-base sm:[&_input]:tw-text-sm [&_select]:tw-text-base sm:[&_select]:tw-text-sm [&_textarea]:tw-text-base sm:[&_textarea]:tw-text-sm [&_input:not([type=checkbox]):not([type=radio])]:!tw-transition [&_input:not([type=checkbox]):not([type=radio])]:!tw-duration-300 [&_input:not([type=checkbox]):not([type=radio])]:!tw-ease-out [&_select]:!tw-transition [&_select]:!tw-duration-300 [&_select]:!tw-ease-out [&_textarea]:!tw-transition [&_textarea]:!tw-duration-300 [&_textarea]:!tw-ease-out [&_input:not([type=checkbox]):not([type=radio]):focus]:!tw-border-primary-400 [&_input:not([type=checkbox]):not([type=radio]):focus]:!tw-ring-primary-400 [&_select:focus]:!tw-border-primary-400 [&_select:focus]:!tw-ring-primary-400 [&_textarea:focus]:!tw-border-primary-400 [&_textarea:focus]:!tw-ring-primary-400 desktop-hover:[&_input:not([type=checkbox]):not([type=radio]):hover:not(:focus)]:!tw-ring-white/15 desktop-hover:[&_select:hover:not(:focus)]:!tw-ring-white/15 desktop-hover:[&_textarea:hover:not(:focus)]:!tw-ring-white/15";
