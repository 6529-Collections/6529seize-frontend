"use client";

import BoostIcon from "@/components/common/icons/BoostIcon";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { memo } from "react";
import {
  getBoostedDropBoostLabel,
  getBoostedDropCompactAuthorLabel,
  getBoostedDropOpenLabel,
} from "./boostedDropText";

interface BoostedDropCompactChatItemProps {
  readonly drop: ApiDrop;
  readonly onClick: () => void;
}

const BoostedDropCompactChatItem = memo(
  ({ drop, onClick }: BoostedDropCompactChatItemProps) => {
    const authorLabel = getBoostedDropCompactAuthorLabel(drop.author.handle);
    const boostLabel = getBoostedDropBoostLabel(drop.boosts);

    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={getBoostedDropOpenLabel(drop.author.handle)}
        className="tw-group tw-flex tw-min-h-12 tw-w-full tw-min-w-0 tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/75 tw-px-3 tw-py-2 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900/85"
      >
        <span className="tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-amber-500/15 tw-bg-amber-500/5">
          <BoostIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-text-amber-300/90"
            focusable="false"
            variant="filled"
          />
        </span>
        <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5 sm:tw-flex-row sm:tw-items-center sm:tw-gap-2">
          <span className="tw-flex-shrink-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-300">
            {t(DEFAULT_LOCALE, "home.boostedDrop.badge")}
          </span>
          <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
            {authorLabel}
          </span>
        </span>
        <span className="tw-ml-auto tw-flex-shrink-0 tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-black/25 tw-px-2 tw-py-1 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-400">
          {boostLabel}
        </span>
      </button>
    );
  }
);

BoostedDropCompactChatItem.displayName = "BoostedDropCompactChatItem";

export default BoostedDropCompactChatItem;
