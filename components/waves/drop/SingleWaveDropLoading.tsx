"use client";

import { useEffect } from "react";

import SpinnerLoader from "@/components/common/SpinnerLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface SingleWaveDropLoadingProps {
  readonly onClose?: (() => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly isError?: boolean;
}

export default function SingleWaveDropLoading({
  onClose,
  onRetry,
  isError = false,
}: SingleWaveDropLoadingProps) {
  const locale = useBrowserLocale();
  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  const buttonClass =
    "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

  return (
    <div
      className="tailwind-scope tw-relative tw-flex tw-h-full tw-min-h-80 tw-w-full tw-flex-1 tw-flex-col tw-bg-iron-950"
      data-testid="single-drop-loading"
    >
      {onClose && (
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-p-3">
          <button
            type="button"
            className={buttonClass}
            onClick={onClose}
            aria-label={t(locale, "singleDrop.closeLabel")}
          >
            {t(locale, "singleDrop.close")}
          </button>
        </div>
      )}
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-p-4">
        {isError ? (
          <>
            <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
              {t(locale, "singleDrop.loadError")}
            </p>
            {onRetry && (
              <button type="button" className={buttonClass} onClick={onRetry}>
                {t(locale, "waves.loadingRetry")}
              </button>
            )}
          </>
        ) : (
          <SpinnerLoader text={t(locale, "singleDrop.loading")} />
        )}
      </div>
    </div>
  );
}
