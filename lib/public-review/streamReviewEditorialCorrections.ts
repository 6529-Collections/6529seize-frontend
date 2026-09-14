import "next/dist/compiled/server-only";

import { createHash } from "node:crypto";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { replaceRequiredEditorialMarkdown } from "./editorialReplacement";
import type { PublicReviewSource } from "./publicReviewTypes";

import corrections from "./streamReviewEditorialCorrections.json";
import messages from "@/i18n/messages/public-review-corrections.json";

/**
 * Applies localized corrections only to the pinned current reading view.
 * Saved routes and unaffected chapters keep their original Markdown.
 * @throws When the source identity or saved content no longer matches the corrections.
 */
export function getCurrentStreamEditorialMarkdown({
  pageId,
  markdown,
  version,
  routeVersion,
  source,
  locale = DEFAULT_LOCALE,
}: {
  readonly pageId: string;
  readonly markdown: string;
  readonly version: string;
  readonly routeVersion?: string | undefined;
  readonly source: PublicReviewSource;
  readonly locale?: SupportedLocale;
}): string {
  const correction = Object.hasOwn(corrections.pages, pageId)
    ? corrections.pages[pageId as keyof typeof corrections.pages]
    : undefined;
  if (routeVersion !== undefined || !correction) return markdown;
  if (
    version !== corrections.reviewVersion ||
    source.repository !== corrections.source.repository ||
    source.commit !== corrections.source.commit ||
    createHash("sha256").update(markdown, "utf8").digest("hex") !==
      correction.sha256
  ) {
    throw new Error(
      `Stream editorial corrections must be reviewed for this source snapshot: ${pageId}.`
    );
  }
  return correction.replacements.reduce((result, [original, messageKey]) => {
    if (!original || !messageKey || !Object.hasOwn(messages, messageKey)) {
      throw new Error(`Invalid Stream correction: ${pageId}.`);
    }
    return replaceRequiredEditorialMarkdown(
      result,
      original,
      t(locale, messageKey as keyof typeof messages),
      pageId
    );
  }, markdown);
}
