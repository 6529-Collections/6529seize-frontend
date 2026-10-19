"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface SingleWaveDropLoadingProps {
  readonly onClose?: (() => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly isError?: boolean;
}

function restorePanelFocus(
  previousFocus: Element | null,
  host: HTMLElement | null
) {
  // The loaded detail can replace this panel in the same commit. Preserve any
  // focus it acquired, otherwise hand off to its close control or the opener.
  if (document.activeElement !== document.body) return;
  if (
    previousFocus instanceof HTMLElement &&
    previousFocus !== document.body &&
    previousFocus.isConnected &&
    !previousFocus.closest('[inert], [aria-hidden="true"]')
  ) {
    previousFocus.focus({ preventScroll: true });
  } else if (host?.isConnected) {
    host
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
  }
}

export default function SingleWaveDropLoading({
  onClose,
  onRetry,
  isError = false,
}: SingleWaveDropLoadingProps) {
  const locale = useBrowserLocale();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasClose = !!onClose;
  useEffect(() => {
    if (!hasClose) return;
    const previousFocus = document.activeElement;
    const host = panelRef.current?.parentElement ?? null;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      queueMicrotask(() => restorePanelFocus(previousFocus, host));
    };
  }, [hasClose]);
  const buttonClass =
    "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

  const onControlKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!onClose || event.defaultPrevented || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <section
      ref={panelRef}
      aria-label={t(locale, "singleDrop.loading")}
      className="tailwind-scope tw-relative tw-flex tw-h-full tw-min-h-80 tw-w-full tw-flex-1 tw-flex-col tw-bg-iron-950"
      data-testid="single-drop-loading"
    >
      {onClose && (
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-p-3">
          <button
            ref={closeRef}
            type="button"
            className={buttonClass}
            onClick={onClose}
            onKeyDown={onControlKeyDown}
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
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  closeRef.current?.focus({ preventScroll: true });
                  onRetry();
                }}
                onKeyDown={onControlKeyDown}
              >
                {t(locale, "waves.loadingRetry")}
              </button>
            )}
          </>
        ) : (
          <output
            aria-label={t(locale, "singleDrop.loading")}
            aria-busy="true"
            className="tw-flex tw-flex-col tw-items-center tw-gap-3"
          >
            <CircleLoader size={CircleLoaderSize.XLARGE} />
            <span className="tw-text-sm tw-text-iron-400">
              {t(locale, "singleDrop.loading")}
            </span>
          </output>
        )}
      </div>
    </section>
  );
}
