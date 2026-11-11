import clsx from "clsx";

export type CommonTabsActiveTone = "neutral" | "primary";

export const CONNECTED_TAB_LIST_CLASSES =
  "tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/75 tw-p-0.5";

export function getConnectedTabButtonClasses({
  isActive,
  fill = false,
  activeTone = "neutral",
}: {
  readonly isActive: boolean;
  readonly fill?: boolean;
  readonly activeTone?: CommonTabsActiveTone;
}) {
  const activeClasses =
    activeTone === "primary"
      ? "tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-600"
      : "tw-bg-iron-800 tw-text-iron-100 desktop-hover:hover:tw-bg-white/[0.14]";

  return clsx(
    "tw-flex tw-min-h-[34px] tw-min-w-11 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-px-3 tw-py-1.5 tw-text-[13px] tw-font-medium tw-leading-5 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 touch-only:tw-min-h-11 motion-reduce:tw-transition-none max-sm:tw-min-h-11 max-[360px]:tw-px-1.5",
    fill && "tw-flex-1",
    isActive
      ? `${activeClasses} tw-ring-1 tw-ring-inset tw-ring-white/5`
      : "tw-bg-transparent tw-text-iron-400 active:tw-bg-iron-900 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100"
  );
}
