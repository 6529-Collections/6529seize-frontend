import clsx from "clsx";

export type PillTabSize = "sm" | "md";

export function getPillTabClasses({
  active,
  size = "sm",
}: {
  readonly active: boolean;
  readonly size?: PillTabSize | undefined;
}): string {
  return clsx(
    "tw-inline-flex tw-h-8 tw-flex-none tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-px-3 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none",
    size === "sm" ? "tw-text-xs" : "tw-text-sm",
    active
      ? "tw-bg-white/[0.08] tw-font-semibold tw-text-iron-50"
      : "tw-bg-transparent tw-font-medium tw-text-iron-500 active:tw-bg-white/[0.06] desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-200"
  );
}
