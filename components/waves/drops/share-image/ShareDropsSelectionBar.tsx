"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useId } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { MAX_SHARE_IMAGE_POSTS } from "@/lib/share-drops-image/shareDropsImageFormat";

/**
 * The bar shown while choosing posts: count, one instruction, Cancel and
 * Next. Desktop places it over the top of the conversation; phones place it
 * at the bottom, in thumb reach. Escape cancels.
 */
export default function ShareDropsSelectionBar({
  count,
  isTooLong,
  onCancel,
  onNext,
}: {
  readonly count: number;
  readonly isTooLong: boolean;
  readonly onCancel: () => void;
  readonly onNext: () => void;
}) {
  const locale = useBrowserLocale();
  const hintId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const title =
    count === 1
      ? t(locale, "shareImage.select.countOne")
      : t(locale, "shareImage.select.countOther", { count });

  return (
    <section
      aria-label={t(locale, "shareImage.title")}
      aria-describedby={hintId}
      className="tailwind-scope tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-40 tw-flex tw-items-center tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-primary-400/35 tw-bg-[#0b0f1d] tw-px-4 tw-py-3 tw-pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:tw-bottom-auto md:tw-top-0 md:tw-border-b md:tw-border-t-0"
    >
      <div className="tw-min-w-0 tw-flex-1">
        <p
          aria-live="polite"
          className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50"
        >
          <span className="tw-hidden md:tw-inline">
            {t(locale, "shareImage.title")} ·{" "}
          </span>
          {title}
        </p>
        <p
          id={hintId}
          role={isTooLong ? "alert" : undefined}
          className={`tw-m-0 tw-mt-0.5 tw-text-xs ${isTooLong ? "tw-text-error" : "tw-text-iron-400"}`}
        >
          {isTooLong
            ? t(locale, "shareImage.select.tooLong", {
                max: MAX_SHARE_IMAGE_POSTS,
              })
            : t(locale, "shareImage.select.hint", {
                max: MAX_SHARE_IMAGE_POSTS,
              })}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3.5 tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800"
      >
        {t(locale, "shareImage.cancel")}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={count === 0 || isTooLong}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500 desktop-hover:hover:tw-bg-primary-600"
      >
        {t(locale, "shareImage.next")}
        <ChevronRightIcon aria-hidden="true" className="tw-size-4" />
      </button>
    </section>
  );
}
