import type { Metadata } from "next";

import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";

/** Test pages: titled, described, and kept out of search results. */
export function streamSepoliaMetadata(titleKey: MessageKey): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, titleKey),
      description: t(DEFAULT_LOCALE, "streamSepolia.metaDescription"),
    },
    { robots: { index: false, follow: false } }
  );
}
