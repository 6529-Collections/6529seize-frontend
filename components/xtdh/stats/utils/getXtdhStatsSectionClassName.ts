const BASE_SECTION_CLASSNAME = "tw-min-w-0 tw-text-iron-100";

export function getXtdhStatsSectionClassName(className?: string): string {
  return [BASE_SECTION_CLASSNAME, className ?? ""].join(" ").trim();
}
