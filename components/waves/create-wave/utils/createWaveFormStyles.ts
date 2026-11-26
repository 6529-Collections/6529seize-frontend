/** Opt-in phone styling; shared forms keep their existing styles by default. */
export const DECISION_EDITOR_MOBILE_STYLES = {
  heading:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-text-[15px] max-md:group-data-[decision-editor=true]/decision-editor:tw-leading-5 max-md:group-data-[decision-editor=true]/decision-editor:tw-text-iron-50",
  helper:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-text-meta max-md:group-data-[decision-editor=true]/decision-editor:tw-font-normal max-md:group-data-[decision-editor=true]/decision-editor:tw-leading-[18px] max-md:group-data-[decision-editor=true]/decision-editor:tw-text-iron-400",
  panelPadding:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-px-3 max-md:group-data-[decision-editor=true]/decision-editor:tw-py-4",
  panelInlinePadding:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-px-3",
  panelHeader:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-px-4",
  disclosureHeader:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-h-11 max-md:group-data-[decision-editor=true]/decision-editor:tw-px-4",
  optionGrid:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-grid-cols-1",
  optionCard:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-grid max-md:group-data-[decision-editor=true]/decision-editor:tw-grid-cols-[56px_minmax(0,1fr)] max-md:group-data-[decision-editor=true]/decision-editor:tw-items-center max-md:group-data-[decision-editor=true]/decision-editor:tw-gap-3 max-md:group-data-[decision-editor=true]/decision-editor:tw-p-3",
  preview:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-relative max-md:group-data-[decision-editor=true]/decision-editor:tw-mb-0 max-md:group-data-[decision-editor=true]/decision-editor:tw-h-11 max-md:group-data-[decision-editor=true]/decision-editor:tw-w-14 max-md:group-data-[decision-editor=true]/decision-editor:tw-overflow-hidden max-md:group-data-[decision-editor=true]/decision-editor:tw-p-1",
  previewContent:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-absolute max-md:group-data-[decision-editor=true]/decision-editor:tw-left-1/2 max-md:group-data-[decision-editor=true]/decision-editor:tw-top-1/2 max-md:group-data-[decision-editor=true]/decision-editor:tw-h-20 max-md:group-data-[decision-editor=true]/decision-editor:tw-w-[120px] max-md:group-data-[decision-editor=true]/decision-editor:-tw-translate-x-1/2 max-md:group-data-[decision-editor=true]/decision-editor:-tw-translate-y-1/2 max-md:group-data-[decision-editor=true]/decision-editor:tw-scale-[0.375]",
  optionContent:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-relative max-md:group-data-[decision-editor=true]/decision-editor:tw-w-full max-md:group-data-[decision-editor=true]/decision-editor:tw-items-center max-md:group-data-[decision-editor=true]/decision-editor:tw-gap-3",
  optionTitle:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-text-[15px] max-md:group-data-[decision-editor=true]/decision-editor:tw-font-medium max-md:group-data-[decision-editor=true]/decision-editor:tw-leading-5",
  optionRadio:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-order-last max-md:group-data-[decision-editor=true]/decision-editor:tw-mt-0",
  optionText:
    "max-md:group-data-[decision-editor=true]/decision-editor:tw-min-w-0 max-md:group-data-[decision-editor=true]/decision-editor:tw-flex-1",
} as const;

export const CREATE_WAVE_FORM_STYLES = {
  stepTitle: `tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-white ${DECISION_EDITOR_MOBILE_STYLES.heading}`,
  stepDescription: `tw-m-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300 ${DECISION_EDITOR_MOBILE_STYLES.helper}`,
  sectionTitle: `tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100 ${DECISION_EDITOR_MOBILE_STYLES.heading}`,
  toggleTitle:
    "tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100",
  fieldLabel:
    "tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100",
  supportingText: `tw-m-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400 ${DECISION_EDITOR_MOBILE_STYLES.helper}`,
  compactSupportingText: `tw-m-0 tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-400 ${DECISION_EDITOR_MOBILE_STYLES.helper}`,
} as const;

const CREATE_WAVE_OPTION_STYLES = {
  grid: "tw-grid tw-grid-cols-1 tw-gap-3",
  card: "tw-group tw-grid tw-min-w-0 tw-grid-cols-1 tw-items-center tw-gap-3 tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-3 tw-transition-colors focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 motion-reduce:tw-transition-none sm:tw-grid-cols-[72px_minmax(0,1fr)] sm:tw-gap-4",
  selected: "tw-border-primary-500/60 tw-bg-primary-500/5",
  unselected: "tw-border-white/5 tw-bg-iron-950 hover:tw-border-white/10",
  preview:
    "tw-h-16 tw-w-full tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-2 sm:tw-h-14",
  // Contain the sr-only radio so focusing it cannot scroll an outer layout.
  content: "tw-relative tw-flex tw-min-w-0 tw-items-center tw-gap-4",
} as const;

const DEFAULT_OPTION_STYLES = {
  ...CREATE_WAVE_OPTION_STYLES,
  title: "tw-block tw-text-sm tw-font-medium",
  description: "tw-text-xs tw-font-normal tw-leading-4",
  selectedDescription: "tw-text-iron-300",
  unselectedDescription: "tw-text-iron-400",
} as const;

const DECISION_EDITOR_OPTION_STYLES = {
  ...DEFAULT_OPTION_STYLES,
  title: "tw-block tw-text-[15px] tw-font-medium tw-leading-5 md:tw-text-sm",
  description:
    "tw-text-meta tw-font-normal tw-leading-[18px] md:tw-text-xs md:tw-leading-4",
  selectedDescription: "tw-text-iron-400 md:tw-text-iron-300",
  card: "tw-group tw-grid tw-min-w-0 tw-grid-cols-[56px_minmax(0,1fr)] tw-items-center tw-gap-3 tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-3 tw-transition-colors focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 motion-reduce:tw-transition-none md:tw-grid-cols-[72px_minmax(0,1fr)] md:tw-gap-4",
  preview:
    "tw-h-11 tw-w-14 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-1 md:tw-h-14 md:tw-w-full md:tw-p-2",
} as const;

/** Decision setup has a compact phone layout; other forms retain their styles. */
export function getCreateWaveOptionStyles(decisionEditor: boolean) {
  return decisionEditor ? DECISION_EDITOR_OPTION_STYLES : DEFAULT_OPTION_STYLES;
}

export const CREATE_WAVE_FORM_CONTROL_SCOPE_STYLES =
  "[&_input]:tw-text-base sm:[&_input]:tw-text-sm [&_select]:tw-text-base sm:[&_select]:tw-text-sm [&_textarea]:tw-text-base sm:[&_textarea]:tw-text-sm [&_input:not([type=checkbox]):not([type=radio])]:!tw-transition [&_input:not([type=checkbox]):not([type=radio])]:!tw-duration-300 [&_input:not([type=checkbox]):not([type=radio])]:!tw-ease-out [&_select]:!tw-transition [&_select]:!tw-duration-300 [&_select]:!tw-ease-out [&_textarea]:!tw-transition [&_textarea]:!tw-duration-300 [&_textarea]:!tw-ease-out [&_input:not([type=checkbox]):not([type=radio]):focus]:!tw-border-primary-400 [&_input:not([type=checkbox]):not([type=radio]):focus]:!tw-ring-primary-400 [&_select:focus]:!tw-border-primary-400 [&_select:focus]:!tw-ring-primary-400 [&_textarea:focus]:!tw-border-primary-400 [&_textarea:focus]:!tw-ring-primary-400 desktop-hover:[&_input:not([type=checkbox]):not([type=radio]):hover:not(:focus)]:!tw-ring-white/15 desktop-hover:[&_select:hover:not(:focus)]:!tw-ring-white/15 desktop-hover:[&_textarea:hover:not(:focus)]:!tw-ring-white/15";
