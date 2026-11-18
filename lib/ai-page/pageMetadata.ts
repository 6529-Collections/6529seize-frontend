import type { Metadata } from "next";

import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";

/**
 * Every page under /ai stays out of search engines, as /validator does,
 * and no menu links it yet.
 */
export function getAiPageMetadata(
  title: MessageKey,
  description: MessageKey
): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, title),
      description: t(DEFAULT_LOCALE, description),
    },
    { robots: { index: false, follow: false, nocache: true } }
  );
}
