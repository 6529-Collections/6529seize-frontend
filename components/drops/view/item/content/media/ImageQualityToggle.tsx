"use client";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import IconButton from "@/components/utils/button/IconButton";
import type { IconButtonVariant } from "@/components/utils/button/iconButtonStyles";

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
  let variant: IconButtonVariant = "ghost";
  if (showingOriginal) variant = "selected";
  else if (failed) variant = "error";

  return (
    <>
      <IconButton
        type="button"
        size={36}
        variant={variant}
        aria-label={label}
        aria-pressed={showingOriginal}
        aria-describedby={failed ? errorId : undefined}
        title={failed ? error : label}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
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
      </IconButton>
      <span id={errorId} hidden>
        {error}
      </span>
      <span role="alert" aria-atomic="true" className="tw-sr-only">
        {failed ? error : ""}
      </span>
    </>
  );
}
