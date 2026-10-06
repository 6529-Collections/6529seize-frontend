"use client";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useId } from "react";

export function ImageQualityToggle({
  showingOriginal,
  failed,
  onToggle,
  isGif = true,
}: {
  readonly showingOriginal: boolean;
  readonly failed: boolean;
  readonly onToggle: () => void;
  readonly isGif?: boolean | undefined;
}) {
  const errorId = useId();
  const label = t(
    DEFAULT_LOCALE,
    showingOriginal ? "drop.media.viewOptimized" : "drop.media.viewOriginal"
  );
  const error = t(
    DEFAULT_LOCALE,
    isGif ? "drop.media.originalGifFailed" : "drop.media.originalImageFailed"
  );

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-pressed={showingOriginal}
        aria-describedby={failed ? errorId : undefined}
        title={failed ? error : label}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={clsx(
          "tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-border-0 tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-700",
          {
            "tw-bg-primary-500/20 tw-text-primary-300": showingOriginal,
            "tw-bg-transparent": !showingOriginal,
            "tw-text-iron-100": !showingOriginal && !failed,
            "tw-text-error": !showingOriginal && failed,
          }
        )}
      >
        {failed ? (
          <ExclamationTriangleIcon
            className="tw-size-5"
            aria-hidden="true"
            data-testid={isGif ? "gif-quality-error" : "image-quality-error"}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="tw-size-5"
            aria-hidden="true"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M6 8v8m0-4h4m0-4v8m4-8v8h1a4 4 0 0 0 0-8h-1Z" />
          </svg>
        )}
      </button>
      <span id={errorId} hidden>
        {error}
      </span>
      <span role="alert" aria-atomic="true" className="tw-sr-only">
        {failed ? error : ""}
      </span>
    </>
  );
}
