import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAppMetadata } from "@/components/providers/metadata";
import { isStreamProductEnabled } from "@/config/streamProduct";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";

/** Every /stream/** page except the root 404s while the feature flag is off. */
export function assertStreamProduct(): void {
  if (!isStreamProductEnabled()) {
    notFound();
  }
}

/**
 * Metadata for a section page. The section stays `noindex` until the
 * contracts are on Sepolia r4 and the copy is approved (owner decision).
 */
export function streamPageMetadata(
  title: MessageKey,
  path: string,
  params: Record<string, string> = {}
): Metadata {
  const page = t(DEFAULT_LOCALE, title, params);
  const section = t(DEFAULT_LOCALE, "stream.section.name");
  return getAppMetadata(
    {
      title:
        page === section
          ? section
          : t(DEFAULT_LOCALE, "stream.metadata.title", { page }),
      description: t(DEFAULT_LOCALE, "stream.metadata.description"),
    },
    { canonicalPath: path, robots: { index: false, follow: false } }
  );
}
