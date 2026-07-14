import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface VoteRationaleReplyMarkdownParams {
  readonly voteTotal: number;
  readonly voteChange: number;
  readonly locale?: SupportedLocale | undefined;
}

const formatSignedVote = (locale: SupportedLocale, value: number): string => {
  if (value === 0) {
    return "0";
  }

  const formattedValue = formatInteger(locale, Math.abs(value));
  return value > 0 ? `+${formattedValue}` : `-${formattedValue}`;
};

export const getVoteRationaleReplyMarkdown = ({
  voteTotal,
  voteChange,
  locale = DEFAULT_LOCALE,
}: VoteRationaleReplyMarkdownParams): string => {
  const formattedTotal = formatSignedVote(locale, voteTotal);

  if (voteTotal === voteChange) {
    return t(locale, "waves.voteRationale.prefixTotal", {
      voteTotal: formattedTotal,
    });
  }

  return t(locale, "waves.voteRationale.prefixTotalAndChange", {
    voteTotal: formattedTotal,
    voteChange: formatSignedVote(locale, voteChange),
  });
};
