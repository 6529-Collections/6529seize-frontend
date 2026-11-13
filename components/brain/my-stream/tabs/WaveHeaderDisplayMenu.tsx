"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import type { CompactMenuItem } from "@/components/compact-menu";
import DisplayTimeZoneSwitch from "@/components/display-time-zone/DisplayTimeZoneSwitch";
import {
  WAVE_HEADER_ACTION_CLASSES,
  WAVE_HEADER_ACTION_SURFACE_CLASSES,
} from "@/components/brain/left-sidebar/waves/WaveHeaderActions";

/** A non-modal preferences popover: ordinary buttons and radio groups keep Tab navigation. */
export default function WaveHeaderDisplayMenu({
  items,
  tooltipId,
}: {
  readonly items: readonly CompactMenuItem[];
  readonly tooltipId: string;
}) {
  return (
    <Popover className="tw-relative tw-flex tw-shrink-0">
      <PopoverButton
        aria-label="More wave actions"
        aria-haspopup="dialog"
        data-tooltip-id={tooltipId}
        data-tooltip-content="More wave actions"
        className={WAVE_HEADER_ACTION_CLASSES}
      >
        <span className={WAVE_HEADER_ACTION_SURFACE_CLASSES}>
          <EllipsisVerticalIcon aria-hidden="true" className="tw-size-5" />
        </span>
      </PopoverButton>
      <PopoverPanel
        anchor={{ to: "bottom end", gap: 8, padding: 16 }}
        role="dialog"
        aria-label="More wave actions"
        className="tailwind-scope tw-z-[1030] tw-w-80 tw-max-w-[calc(100vw-2rem)] tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-3 tw-shadow-xl tw-shadow-black/60"
      >
        {({ close }) => (
          <>
            {items.map((item) =>
              item.kind === "section" ? (
                <p
                  key={item.id}
                  className="tw-m-0 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-400"
                >
                  {item.label}
                </p>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  aria-label={item.ariaLabel}
                  onClick={() => {
                    close();
                    item.onSelect?.();
                  }}
                  className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            )}
            {items.length > 0 && (
              <hr className="tw-my-3 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800" />
            )}
            <DisplayTimeZoneSwitch variant="settings" />
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
