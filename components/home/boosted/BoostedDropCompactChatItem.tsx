"use client";

import BoostIcon from "@/components/common/icons/BoostIcon";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { memo } from "react";
import {
  getBoostedDropBoostLabel,
  getBoostedDropCompactAuthorLabel,
  getBoostedDropCompactPreviewText,
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
    const previewText = getBoostedDropCompactPreviewText(drop);

    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={getBoostedDropOpenLabel(drop.author.handle)}
        data-testid="boosted-drop-compact-chat-item"
        className="tw-group tw-flex tw-min-h-12 tw-w-full tw-min-w-0 tw-items-center tw-gap-2.5 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/75 tw-px-3 tw-py-2 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900/85"
      >
        <span className="tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-amber-500/15 tw-bg-amber-500/5">
          <BoostIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-text-amber-300/90"
            focusable="false"
            variant="filled"
          />
        </span>
        <span className="tw-relative tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-self-stretch">
          <span
            data-boosted-drop-compact-summary="true"
            className={
              previewText
                ? "tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5 tw-transition-opacity tw-duration-200 group-focus-visible:tw-opacity-0 desktop-hover:group-hover:tw-opacity-0 motion-reduce:tw-transition-none sm:tw-flex-row sm:tw-items-center sm:tw-gap-2"
                : "tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5 sm:tw-flex-row sm:tw-items-center sm:tw-gap-2"
            }
          >
            <span className="tw-flex-shrink-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-300">
              {t(DEFAULT_LOCALE, "home.boostedDrop.badge")}
            </span>
            <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
              {authorLabel}
            </span>
          </span>
          {previewText && (
            <span
              aria-hidden="true"
              data-boosted-drop-compact-preview="true"
              className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-items-center tw-overflow-hidden tw-opacity-0 tw-transition-opacity tw-duration-200 group-focus-visible:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 motion-reduce:tw-transition-none"
            >
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-z-10 tw-w-5 tw-bg-gradient-to-r tw-from-iron-950/95 tw-to-transparent desktop-hover:group-hover:tw-from-iron-900/95" />
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-z-10 tw-w-7 tw-bg-gradient-to-l tw-from-iron-950/95 tw-to-transparent desktop-hover:group-hover:tw-from-iron-900/95" />
              <span
                data-boosted-drop-compact-preview-track="true"
                className="tw-[text-shadow:0_0_12px_rgba(132,173,255,0.22)] tw-flex tw-min-w-max tw-items-center tw-gap-8 tw-whitespace-nowrap tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100 group-focus-visible:tw-animate-boosted-preview-marquee desktop-hover:group-hover:tw-animate-boosted-preview-marquee motion-reduce:tw-transform-none motion-reduce:tw-animate-none"
              >
                <span>{previewText}</span>
                <span>{previewText}</span>
              </span>
            </span>
          )}
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
