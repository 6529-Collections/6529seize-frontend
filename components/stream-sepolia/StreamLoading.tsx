"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import DotLoader from "@/components/dotLoader/DotLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";

import styles from "./StreamLoading.module.css";

const subscribeNever = () => () => undefined;

/** False in the server render (and in a page whose JavaScript never ran), true once hydrated. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

/** After this long a read is treated as stuck: say so and offer to try again. */
const SLOW_MS = 20_000;

/**
 * The site's dot loader with a spoken "Reading Sepolia". A read that takes
 * longer than 20 seconds turns into a plain line with a Retry button, so the
 * page never spins without end.
 */
export function StreamLoading({ onRetry }: { readonly onRetry?: (() => void) | undefined }) {
  const locale = useBrowserLocale();
  const hydrated = useHydrated();
  // Reloads this page; works without the page's JavaScript.
  const here = usePathname();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, []);
  if (slow && onRetry) {
    return (
      <div role="alert" className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-py-2 tw-text-sm tw-text-iron-300">
        <span>{t(locale, "streamSepolia.slow")}</span>
        <button
          type="button"
          onClick={() => {
            setSlow(false);
            onRetry();
          }}
          className="tw-h-9 tw-rounded-lg tw-border-0 tw-bg-white/[0.08] tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-white/[0.12]"
        >
          {t(locale, "streamSepolia.retry")}
        </button>
      </div>
    );
  }
  return (
    <div role="status" className="tw-flex tw-items-center tw-gap-3 tw-py-2 tw-text-sm tw-text-iron-400">
      <DotLoader />
      <span>{t(locale, "streamSepolia.loading")}</span>
      {hydrated ? null : (
        // A plain link: it works without the page's JavaScript.
        <a href={here} className={`${styles["reloadHint"] ?? ""} tw-text-primary-300 tw-underline tw-underline-offset-4`}>
          {t(locale, "streamSepolia.reloadHint")}
        </a>
      )}
    </div>
  );
}
