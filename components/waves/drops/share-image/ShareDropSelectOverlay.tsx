"use client";

import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useShareDropsSelection } from "./ShareDropsSelectionContext";

/**
 * While choosing posts for an image, each post is one toggle button that
 * covers the row, so links and long-press menus underneath stay inert.
 */
export default function ShareDropSelectOverlay({
  drop,
}: {
  readonly drop: ExtendedDrop;
}) {
  const locale = useBrowserLocale();
  const selection = useShareDropsSelection();
  if (!selection?.isSelecting) return null;

  const selected = selection.isSelected(drop.serial_no);
  const endpoint = selection.getEndpoint(drop.serial_no);
  const author = drop.author.handle ?? drop.author.primary_address;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={
        author
          ? t(locale, "shareImage.select.post", { author })
          : t(locale, "shareImage.select.postUnknown")
      }
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        selection.choose(drop.serial_no);
      }}
      className={clsx(
        "tw-absolute tw-inset-0 tw-z-30 tw-m-0 tw-flex tw-cursor-pointer tw-items-start tw-justify-end tw-gap-2 tw-border-0 tw-p-2 tw-text-left tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none",
        selected
          ? "tw-bg-primary-500/10"
          : "tw-bg-transparent desktop-hover:hover:tw-bg-white/5"
      )}
    >
      {endpoint && (
        <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-primary-300">
          {t(
            locale,
            endpoint === "first"
              ? "shareImage.select.first"
              : "shareImage.select.last"
          )}
        </span>
      )}
      <span
        aria-hidden="true"
        className={clsx(
          "tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid",
          selected
            ? "tw-border-primary-500 tw-bg-primary-500 tw-text-white"
            : "tw-border-iron-500 tw-bg-black/60"
        )}
      >
        {selected && <CheckIcon className="tw-size-3.5" />}
      </span>
    </button>
  );
}
