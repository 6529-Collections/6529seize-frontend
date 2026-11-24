import {
  chainErrorMessage,
  chainRefusalName,
} from "@/components/chain-identity/chainErrorMessage";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { ChainGatewayError } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";

/**
 * The 6529 Network's refusals of votes, poll ballots, wave REP, entries and
 * their withdrawal, in plain words (chain-tx `codes`). Other refusals (fees,
 * browser keys, ratings) and errors before the chain answered are worded as
 * the identity flows word them.
 */
const WAVES_REFUSALS: Readonly<Record<string, string>> = {
  NOT_FOUND: "This isn't on the 6529 Network.",
  DECISION_NOT_OPEN: "This decision isn't open.",
  ENTRY_NOT_IN_DECISION: "This entry isn't in this decision.",
  STALE_VERSION:
    "This changed on the 6529 Network since you opened it. Try again.",
  WAVE_CLOSED: "This wave is closed.",
  RESULT_PENDING:
    "This decision is counting its result. Try again in a few minutes.",
  VOTING_CLOSED: "Voting is closed in this decision.",
  OVER_CREDIT: "You don't have enough voting credit for this vote.",
  NEGATIVE_FORBIDDEN: "Negative votes aren't allowed in this decision.",
  ENTRY_NOT_ACTIVE: "This entry no longer takes votes.",
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

/** Which write a refusal answers, for the sentences that differ by write. */
type ChainWavesWrite = "vote" | "ballot" | "rating" | "entry" | "withdrawal";

/**
 * The sentences that differ by write; other names read as WAVES_REFUSALS
 * has them. NOT_ELIGIBLE: outside the decision's vote group, the poll's,
 * the wave's, or the decision's submit group. An entry's and a
 * withdrawal's names are SUBMISSION_CREATE's and SUBMISSION_WITHDRAW's.
 */
const BY_WRITE: Readonly<
  Record<ChainWavesWrite, Readonly<Record<string, string>>>
> = {
  vote: { NOT_ELIGIBLE: "You can't vote in this decision." },
  ballot: { NOT_ELIGIBLE: "You can't answer this poll." },
  rating: { NOT_ELIGIBLE: "You can't rate this wave." },
  entry: {
    NOT_FOUND: "This decision isn't on the 6529 Network.",
    DECISION_NOT_OPEN: "This decision isn't taking entries.",
    PARTICIPATION_CLOSED: "This decision isn't taking entries right now.",
    NOT_ELIGIBLE: "You can't enter this decision.",
    ENTRY_LIMIT:
      "You already have as many entries in this decision as it allows.",
    ACTIVE_ENTRY_LIMIT: "This decision has as many entries as it can take.",
  },
  withdrawal: {
    NOT_FOUND: "This entry isn't on the 6529 Network.",
    NOT_AUTHORIZED_FOR_OBJECT: "Only the entry's author can withdraw it.",
    ENTRY_NOT_ACTIVE:
      "This entry is no longer in the running, so it can't be withdrawn.",
  },
};

const refusalSentence = (
  name: string | null,
  write: ChainWavesWrite
): string | undefined => {
  if (name === null) {
    return undefined;
  }
  return BY_WRITE[write][name] ?? WAVES_REFUSALS[name];
};

/**
 * What to tell someone whose vote, ballot, wave REP change, entry or
 * withdrawal didn't go in, or null when they declined it in the wallet. A refusal from a block says
 * the fee was still charged.
 */
export function chainWavesErrorMessage(
  locale: SupportedLocale,
  error: unknown,
  write: ChainWavesWrite = "vote"
): string | null {
  const reason =
    refusalSentence(chainRefusalName(error), write) ??
    chainErrorMessage(locale, error);
  if (reason === null) {
    return null;
  }
  return error instanceof ChainOperationError && error.reason === "failed"
    ? t(locale, "chainIdentity.action.failedCharged", { reason })
    : reason;
}

const isChainError = (error: unknown): boolean =>
  error instanceof ChainOperationError ||
  error instanceof ChainGatewayError ||
  chainRefusalName(error) !== null;

/**
 * The line under a failed write's title: the 6529 Network's reason in plain
 * words when the write went there, else `fallback` (6529.io's own writes).
 */
export function chainWriteFailure(
  locale: SupportedLocale,
  error: unknown,
  fallback: string,
  write: ChainWavesWrite = "vote"
): string {
  return isChainError(error)
    ? (chainWavesErrorMessage(locale, error, write) ?? fallback)
    : fallback;
}

/**
 * A failed write's toast details: none when the write went to the 6529
 * Network, whose reason is already the description. 6529.io's sanitizer
 * would read "Network" or "wallet" in it as a connection problem.
 */
export function chainWriteDetails(error: unknown): string | undefined {
  return isChainError(error) ? undefined : getToastErrorDetails(error);
}
