import { formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

/**
 * A file's size in decimal units, as most download pages write them:
 * "95.5 MB", and "1.2 GB" for the CUDA packages. Null when the feed gives
 * no size.
 */
export function formatAiFileSize(bytes: number | null): string | null {
  if (bytes === null) {
    return null;
  }
  if (bytes >= 1_000_000_000) {
    return t(LOCALE, "ai.files.size.gb", {
      size: formatNumber(LOCALE, bytes / 1_000_000_000, ONE_DECIMAL),
    });
  }
  if (bytes >= 1_000_000) {
    return t(LOCALE, "ai.files.size.mb", {
      size: formatNumber(LOCALE, bytes / 1_000_000, ONE_DECIMAL),
    });
  }
  return t(LOCALE, "ai.files.size.kb", {
    size: formatNumber(LOCALE, Math.max(1, Math.round(bytes / 1000))),
  });
}
