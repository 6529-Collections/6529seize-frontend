import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import { formatDate, formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  withDisplayTimeZone,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

/**
 * Shows the active submission count for approval waves and the deadline in
 * the display time zone for other waves.
 */
export function getActiveWaveVoteLabel(
  vote: ApiActiveWaveVote,
  locale: SupportedLocale,
  zone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE
): string {
  const {
    active_submission_count: count,
    voting_ends_at: end,
    next_decision_at: decision,
  } = vote;
  if (typeof count === "number") {
    const key =
      selectPluralCategory(locale, count) === "one"
        ? "waves.discovery.activeSubmissions.one"
        : "waves.discovery.activeSubmissions.other";
    return t(locale, key, { count: formatInteger(locale, count) });
  }
  const deadline =
    end !== null && (decision === null || end <= decision) ? end : decision;
  const deadlineMessage =
    deadline === end
      ? "waves.discovery.votingEnds"
      : "waves.discovery.nextDecision";
  return deadline === null
    ? t(locale, "waves.discovery.votingOpen")
    : t(locale, deadlineMessage, {
        date: formatDate(
          locale,
          deadline,
          withDisplayTimeZone(zone, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        ),
      });
}
