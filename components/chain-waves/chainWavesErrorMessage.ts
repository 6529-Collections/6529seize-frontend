import {
  chainErrorMessage,
  chainRefusalName,
} from "@/components/chain-identity/chainErrorMessage";
import type { SupportedLocale } from "@/i18n/locales";
import { ChainGatewayError } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";

/**
 * The 6529 Network's refusals of votes, poll ballots and wave REP, in plain
 * words (chain-tx `codes`). Other refusals (fees, browser keys, ratings) and
 * errors before the chain answered are worded as the identity flows word
 * them.
 */
const WAVES_REFUSALS: Readonly<Record<string, string>> = {
  NOT_FOUND: "This isn't on the 6529 Network.",
  STALE_VERSION:
    "This changed on the 6529 Network since you opened it. Try again.",
  WAVE_CLOSED: "This wave is closed.",
  RESULT_PENDING:
    "This decision is counting its result. Try again in a few minutes.",
  VOTING_CLOSED: "Voting is closed in this decision.",
  OVER_CREDIT: "You don't have enough voting credit for this vote.",
  NEGATIVE_FORBIDDEN: "Negative votes aren't allowed in this decision.",
  ENTRY_NOT_ACTIVE: "This entry no longer takes votes.",
  NOT_ELIGIBLE: "You can't vote in this decision.",
  OVER_CAP: "This vote is above the limit for one entry.",
  VOTE_OUT_OF_RANGE: "This vote is outside the range this decision allows.",
  VOTE_LIMIT: "You've voted on as many entries as this decision allows.",
  BUDGET_SCOPE_MISMATCH:
    "This decision's voting rules changed. Reload the page and try again.",
  CREDIT_STALE: "Your voting credit is being updated. Try again in a minute.",
  VOTES_REDUCING:
    "Votes are being reduced after a credit change. Try again in a minute.",
  POLL_CLOSED: "This poll is closed.",
  POLL_CHOICES: "That's more options than this poll allows.",
  POLL_NOT_ELIGIBLE: "You can't answer this poll.",
};

/**
 * What to tell someone whose vote, ballot or wave REP change didn't go in,
 * or null when they declined it in the wallet.
 */
export function chainWavesErrorMessage(
  locale: SupportedLocale,
  error: unknown
): string | null {
  const name = chainRefusalName(error);
  const sentence = name === null ? undefined : WAVES_REFUSALS[name];
  return sentence ?? chainErrorMessage(locale, error);
}

/**
 * The line under a failed write's title: the 6529 Network's reason in plain
 * words when the write went there, else `fallback` (6529.io's own writes).
 */
export function chainWriteFailure(
  locale: SupportedLocale,
  error: unknown,
  fallback: string
): string {
  const isChain =
    error instanceof ChainOperationError ||
    error instanceof ChainGatewayError ||
    chainRefusalName(error) !== null;
  return isChain
    ? (chainWavesErrorMessage(locale, error) ?? fallback)
    : fallback;
}
