"use client";

import DotLoader from "@/components/dotLoader/DotLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";

/** The site's dot loader with a spoken "Reading Sepolia" for screen readers. */
export function StreamLoading() {
  const locale = useBrowserLocale();
  return (
    <div role="status" className="tw-flex tw-items-center tw-gap-3 tw-py-2 tw-text-sm tw-text-iron-400">
      <DotLoader />
      <span>{t(locale, "streamSepolia.loading")}</span>
    </div>
  );
}
