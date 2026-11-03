import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function getActiveWaveVoteDeadlineLabel(
  vote: ApiActiveWaveVote,
  locale: SupportedLocale
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
        date: formatDate(locale, deadline, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      });
}
