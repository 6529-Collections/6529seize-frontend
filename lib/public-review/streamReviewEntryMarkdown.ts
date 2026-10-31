import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/public-review";
import type { PublicReviewSource } from "./publicReviewTypes";
import {
  STREAM_REVIEW_ENTRY_GUIDE_VERSION,
  STREAM_REVIEW_ENTRY_PAGES,
} from "./streamReviewEntryGuides";

// Kept apart from streamReviewEntryGuides: the sidebar on every page imports
// that page list, and this module brings the review copy with it.
export function getStreamReviewEntryMarkdown({
  pageId,
  version,
  source,
  locale = DEFAULT_LOCALE,
}: {
  readonly pageId: string;
  readonly version: string;
  readonly source: PublicReviewSource;
  readonly locale?: SupportedLocale;
}): string | undefined {
  const page = STREAM_REVIEW_ENTRY_PAGES.find((entry) => entry.id === pageId);
  if (!page) return undefined;
  if (
    version !== STREAM_REVIEW_ENTRY_GUIDE_VERSION ||
    source.repository !== "6529-Collections/6529Stream" ||
    source.commit !== "92ea123380917032f01aae09691141a2a72df935"
  ) {
    throw new Error(
      "Stream entry guides must be reviewed for this source snapshot."
    );
  }
  return t(
    locale,
    page.titleKey.replace(/\.title$/, ".markdown") as MessageKey
  );
}
