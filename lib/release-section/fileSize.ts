import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

/** The messages that write a size in each unit, such as "{size} MB". */
type FileSizeMessages = {
  readonly kb: MessageKey;
  readonly mb: MessageKey;
  readonly gb: MessageKey;
};

/**
 * A file's size in decimal units, as most download pages write them:
 * "95.5 MB", "1.2 GB". Null when the release list gives no size.
 */
export function formatReleaseFileSize(
  locale: SupportedLocale,
  bytes: number | null,
  messages: FileSizeMessages
): string | null {
  if (bytes === null) {
    return null;
  }
  if (bytes >= 1_000_000_000) {
    return t(locale, messages.gb, {
      size: formatNumber(locale, bytes / 1_000_000_000, ONE_DECIMAL),
    });
  }
  if (bytes >= 1_000_000) {
    return t(locale, messages.mb, {
      size: formatNumber(locale, bytes / 1_000_000, ONE_DECIMAL),
    });
  }
  return t(locale, messages.kb, {
    size: formatNumber(locale, Math.max(1, Math.round(bytes / 1000))),
  });
}
