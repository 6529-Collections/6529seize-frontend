import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  withDisplayTimeZone,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

/**
 * "Voting ends Jan 1, 11:59 PM" or "Next result …", in the display time zone.
 * Outside the device zone the time names its zone ("11:59 PM UTC").
 */
export function getActiveWaveVoteDeadlineLabel(
  vote: ApiActiveWaveVote,
  locale: SupportedLocale,
  zone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE
): string {
  const { voting_ends_at: end, next_decision_at: decision } = vote;
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
