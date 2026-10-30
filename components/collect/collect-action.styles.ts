import { getButtonClasses } from "@/components/utils/button/buttonStyles";

// Keep inline, sticky and menu-trigger actions on the same tertiary treatment.
export const COLLECT_SECONDARY_ACTION_STYLE = getButtonClasses({
  variant: "tertiary",
  size: null,
  className: "tw-h-11 tw-text-sm !tw-font-medium",
});

export const COLLECT_SECONDARY_ACTION_CLASS = `${COLLECT_SECONDARY_ACTION_STYLE} tw-px-3`;
