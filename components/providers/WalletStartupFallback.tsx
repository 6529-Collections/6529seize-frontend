"use client";

import { useAppKitBootstrap } from "@/components/providers/AppKitBootstrapContext";

export default function WalletStartupFallback() {
  const { status } = useAppKitBootstrap();
  const hasError = status === "error";

  return (
    <div className="tailwind-scope tw-min-h-dvh tw-bg-black tw-text-iron-50">
      <div className="tw-flex tw-min-h-dvh tw-items-center tw-justify-center tw-px-6">
        <div
          role="status"
          aria-live="polite"
          aria-label={hasError ? "Wallet services failed to load" : "Loading"}
          className="tw-flex tw-flex-col tw-items-center tw-gap-5"
        >
          <div
            aria-hidden="true"
            className="tw-text-2xl tw-font-semibold tw-tracking-normal tw-text-iron-100"
          >
            6529
          </div>
          {hasError ? (
            <button
              type="button"
              onClick={() => globalThis.location.reload()}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors desktop-hover:hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              Refresh
            </button>
          ) : (
            <div className="tw-flex tw-gap-1" aria-hidden="true">
              <span className="tw-size-2 tw-animate-pulse tw-rounded-full tw-bg-iron-300" />
              <span className="tw-size-2 tw-animate-pulse tw-rounded-full tw-bg-iron-400 [animation-delay:150ms]" />
              <span className="tw-size-2 tw-animate-pulse tw-rounded-full tw-bg-iron-500 [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
