"use client";

import { useDisplayTimeZoneMenuItem } from "@/components/display-time-zone/DisplayTimeZoneSwitch";

/**
 * The time switch in the long-press post menu on phones, where the app header
 * has no room beside the wave title. Times outside the device zone already
 * carry their zone name, so the posts show when the switch is on.
 */
export default function DisplayTimeZoneMobileMenuItem({
  onSelected,
}: {
  readonly onSelected: () => void;
}) {
  const item = useDisplayTimeZoneMenuItem();
  if (item.kind === "section") {
    return null;
  }
  return (
    <button
      type="button"
      onClick={() => {
        item.onSelect?.();
        onSelected();
      }}
      className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
    >
      <span
        aria-hidden="true"
        className="tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-300 [&>svg]:tw-size-5"
      >
        {item.icon}
      </span>
      <span className="tw-min-w-0 tw-break-words tw-text-base tw-font-semibold tw-text-iron-300">
        {item.label}
      </span>
    </button>
  );
}
