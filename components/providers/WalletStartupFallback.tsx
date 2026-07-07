"use client";

import { useAppKitBootstrap } from "@/components/providers/AppKitBootstrapContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function WalletStartupFallback() {
  const { status } = useAppKitBootstrap();
  const locale = useBrowserLocale();
  const hasError = status === "error";
  const statusLabel = t(
    locale,
    hasError ? "wallet.startup.errorStatus" : "wallet.startup.loadingStatus"
  );
  const errorDescription = t(locale, "wallet.startup.errorDescription");

  return (
    <div className="tailwind-scope tw-min-h-dvh tw-bg-black tw-text-iron-50">
      <div className="tw-flex tw-min-h-dvh tw-items-center tw-justify-center tw-px-6">
        <div
          role={hasError ? "alert" : "status"}
          aria-live={hasError ? "assertive" : "polite"}
          aria-label={hasError ? undefined : statusLabel}
          aria-labelledby={hasError ? "wallet-startup-error-title" : undefined}
          aria-describedby={
            hasError ? "wallet-startup-error-description" : undefined
          }
          className="tw-flex tw-max-w-sm tw-flex-col tw-items-center tw-gap-5 tw-text-center"
        >
          <div
            aria-hidden="true"
            className="tw-text-2xl tw-font-semibold tw-tracking-normal tw-text-iron-100"
          >
            6529
          </div>
          {hasError ? (
            <>
              <div className="tw-flex tw-flex-col tw-gap-2">
                <h1
                  id="wallet-startup-error-title"
                  className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
                >
                  {statusLabel}
                </h1>
                <p
                  id="wallet-startup-error-description"
                  className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-300"
                >
                  {errorDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => globalThis.location.reload()}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors desktop-hover:hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
              >
                {t(locale, "wallet.startup.refresh")}
              </button>
            </>
          ) : (
            <div className="tw-flex tw-gap-1" aria-hidden="true">
              <span className="tw-size-2 tw-animate-pulse tw-rounded-full tw-bg-iron-300 motion-reduce:tw-animate-none" />
              <span className="tw-size-2 tw-animate-pulse tw-rounded-full tw-bg-iron-400 [animation-delay:150ms] motion-reduce:tw-animate-none" />
              <span className="tw-size-2 tw-animate-pulse tw-rounded-full tw-bg-iron-500 [animation-delay:300ms] motion-reduce:tw-animate-none" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
