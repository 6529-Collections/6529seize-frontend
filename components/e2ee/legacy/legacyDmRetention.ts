import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

/**
 * Unencrypted ("legacy") DMs are deleted from 6529's servers, backups
 * included, on this date (owner decision 2026-10-31, 6529chain D146). From
 * then the backend refuses new messages in them (`403 LEGACY_DM_CLOSED`).
 * Keep in step with the backend's `LEGACY_DM_DELETION_CUTOFF` default.
 */
export const LEGACY_DM_DELETION_AT = "2026-12-01T00:00:00.000Z";

const DELETION_MS = Date.parse(LEGACY_DM_DELETION_AT);

/** True from the deletion time on. */
export function isLegacyDmClosed(nowMs: number = Date.now()): boolean {
  return nowMs >= DELETION_MS;
}

/** "Dec 1, 2026" in en-US, "1 Dec 2026" in en-GB: the UTC calendar day. */
export function formatLegacyDmDeletionDate(locale: SupportedLocale): string {
  return formatUtcDate(locale, DELETION_MS, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
