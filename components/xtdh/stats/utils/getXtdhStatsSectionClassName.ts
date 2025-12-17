const BASE_SECTION_CLASSNAME =
  "tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-iron-100 tw-shadow-md tw-shadow-black/30";

export function getXtdhStatsSectionClassName(className?: string): string {
  return [BASE_SECTION_CLASSNAME, className ?? ""].join(" ").trim();
}
