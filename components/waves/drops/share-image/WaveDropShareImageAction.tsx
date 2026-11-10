"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import DropActionTooltip from "../DropActionTooltip";
import { useShareDropsSelection } from "./ShareDropsSelectionContext";

/**
 * "Share as image" for a post: a desktop dropdown row, a mobile long-press
 * sheet row, or an icon button in the hover toolbar signed-out visitors see.
 * Shown only inside a wave conversation; the post becomes the first post of
 * the image.
 */
export default function WaveDropShareImageAction({
  drop,
  onSelected,
  mobile = false,
  toolbar = false,
}: {
  readonly drop: Pick<ApiDrop, "id" | "serial_no">;
  readonly onSelected: () => void;
  readonly mobile?: boolean | undefined;
  readonly toolbar?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const selection = useShareDropsSelection();
  if (!selection || drop.id.startsWith("temp-")) return null;

  const label = t(locale, "shareImage.menuItem");
  const select = () => {
    onSelected();
    selection.start(drop.serial_no);
  };

  if (toolbar) {
    return (
      <DropActionTooltip content={<span className="tw-text-xs">{label}</span>}>
        <button
          type="button"
          aria-label={label}
          onClick={(event) => {
            event.stopPropagation();
            select();
          }}
          className="icon tw-flex tw-size-7 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
        >
          <PhotoIcon
            aria-hidden="true"
            className="tw-h-5 tw-w-5 tw-flex-shrink-0"
          />
        </button>
      </DropActionTooltip>
    );
  }

  if (mobile) {
    return (
      <button
        type="button"
        onClick={select}
        className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-iron-300 active:tw-bg-iron-800"
      >
        <PhotoIcon
          aria-hidden="true"
          className="tw-h-5 tw-w-5 tw-flex-shrink-0"
        />
        <span className="tw-text-base tw-font-semibold">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        select();
      }}
      className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
    >
      <PhotoIcon
        aria-hidden="true"
        className="tw-h-4 tw-w-4 tw-flex-shrink-0"
      />
      <span className="tw-text-sm tw-font-medium">{label}</span>
    </button>
  );
}
