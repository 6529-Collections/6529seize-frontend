"use client";

import { CompactMenu } from "@/components/compact-menu";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { RepDirection } from "./UserPageRep.helpers";

export type RatingListOrder = "rating" | "last_modified";

export default function RatingSortSelect({
  matter,
  direction,
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  readonly matter: "REP" | "NIC";
  readonly direction: RepDirection;
  readonly value: RatingListOrder;
  readonly onChange: (order: RatingListOrder) => void;
  readonly disabled?: boolean;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  const label = t(
    locale,
    value === "rating" ? "user.rate.highestFirst" : "user.rate.recentFirst"
  );
  return (
    <div className="tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
      <span className="tw-shrink-0">{t(locale, "user.rate.sortBy")}</span>
      <CompactMenu
        aria-label={`${t(locale, direction === "given" ? "user.rate.sortGiven" : "user.rate.sortReceived", { matter })}: ${label}`}
        className="tw-min-w-0 tw-max-w-full"
        unstyledTrigger
        triggerClassName={`${COMPACT_ACTION_BUTTON_CLASS} tw-min-h-11 tw-min-w-0 tw-max-w-full ${compact ? "lg:tw-min-h-8" : ""}`}
        trigger={
          <span
            className={`${COMPACT_ACTION_CONTENT_CLASS} tw-min-w-0 tw-max-w-full`}
          >
            <span className="tw-truncate">{label}</span>
            <ChevronDownIcon
              aria-hidden="true"
              className="tw-size-3.5 tw-shrink-0"
            />
          </span>
        }
        disabled={disabled}
        activeItemId={value}
        autoFocusItem={false}
        anchor={compact ? "bottom end" : "bottom start"}
        menuClassName="tailwind-scope tw-z-[1100]"
        menuWidthClassName="tw-w-64 tw-max-w-[calc(100vw-2rem)]"
        itemClassName="tw-min-h-11"
        items={[
          {
            id: "rating",
            label: t(locale, "user.rate.highestFirst"),
            onSelect: () => onChange("rating"),
          },
          {
            id: "last_modified",
            label: t(locale, "user.rate.recentFirst"),
            onSelect: () => onChange("last_modified"),
          },
        ]}
      />
    </div>
  );
}
