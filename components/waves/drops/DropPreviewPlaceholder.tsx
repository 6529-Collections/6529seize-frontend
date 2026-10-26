import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function DropPreviewPlaceholder({
  artwork = false,
  unavailable = false,
  notFound = false,
  href,
}: {
  readonly artwork?: boolean | undefined;
  readonly unavailable?: boolean | undefined;
  readonly notFound?: boolean | undefined;
  readonly href?: string | undefined;
}) {
  return (
    <div
      className={`tw-flex tw-w-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4 ${
        artwork
          ? "tw-min-h-[31.0625rem] sm:tw-min-h-[31.5625rem]"
          : "tw-min-h-28"
      }`}
      aria-busy={!unavailable}
      aria-label={t(DEFAULT_LOCALE, "dropPreview.label")}
      role="group"
    >
      {unavailable ? (
        <div className="tw-my-auto tw-flex tw-flex-col tw-items-start tw-gap-2">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              notFound ? "dropPreview.notFound" : "dropPreview.unavailable"
            )}
          </p>
          {href && (
            <Link
              href={href}
              onClick={(event) => event.stopPropagation()}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-100 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            >
              {t(DEFAULT_LOCALE, "dropPreview.open")}
            </Link>
          )}
        </div>
      ) : (
        <>
          <span className="tw-sr-only">
            {t(DEFAULT_LOCALE, "dropPreview.loading")}
          </span>
          <div
            aria-hidden="true"
            className="tw-flex tw-flex-1 tw-flex-col tw-gap-2 motion-safe:tw-animate-pulse"
          >
            <div className="tw-h-6 tw-w-2/3 tw-rounded-md tw-bg-iron-800 sm:tw-h-7" />
            <div className="tw-h-3 tw-w-1/3 tw-rounded-md tw-bg-iron-800/60" />
            <div className="tw-h-3 tw-w-1/2 tw-rounded-md tw-bg-iron-800/40" />
            {artwork && (
              <div className="tw-mt-auto tw-h-96 tw-w-full tw-rounded-lg tw-bg-iron-900" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
