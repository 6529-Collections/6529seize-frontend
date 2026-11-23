import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { ChainGatewayError } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { ChainRelayError } from "@/lib/chain-identity/relay";

/**
 * The 6529 Network's refusals in plain words. The chain names each refusal
 * (its result names, e.g. `0x2702 OVER_RATING_BUDGET`); a name without a
 * sentence here is shown with the general one.
 */
const KNOWN_NAMES = new Set([
  "ADDRESS_BOUND",
  "BAD_SIGNATURE",
  "BAD_WALLET_SIGNATURE",
  "CATEGORY_NOT_FOUND",
  "CLUSTER_BOUND",
  "DELEGATION_ABSENT",
  "EXPIRED",
  "EXPIRED_AT_EXECUTION",
  "FEE_ALLOWANCE_SPENT",
  "FEE_UNCOVERED",
  "FEE_UNCOVERED_KEY",
  "FEE_UNCOVERED_LIMIT",
  "GRANT_LIMIT",
  "GRANT_INACTIVE",
  "GRANT_NOT_LIVE",
  "HANDLE_RESERVED",
  "HANDLE_TAKEN",
  "IDENTITY_FULL",
  "IDENTITY_HELD",
  "IMPORT_RUNNING",
  "INSUFFICIENT_BALANCE",
  "KEY_NOT_BOUND",
  "KEY_REVOKED",
  "LAST_WALLET",
  "MEMPOOL_TTL",
  "MERGED",
  "NO_CHANGE",
  "NO_RATER_IDENTITY",
  "NO_TARGET_IDENTITY",
  "NO_WALLET",
  "NOT_YET_VALID",
  "OP_NOT_GRANTED",
  "PENDING_CAP",
  "PRINCIPAL_RECONCILING",
  "NONCE",
  "NONCE_WINDOW",
  "NOT_DELEGATOR",
  "NOT_IN_IDENTITY",
  "OVER_GRANT_BUDGET",
  "OVER_RATING_BUDGET",
  "PRINCIPAL_INACTIVE",
  "RATING_LIMIT",
  "REDUCTION_UNDER_WAY",
  "REJOIN_WAIT",
  "REPLACEMENT_UNDERPRICED",
  "SELF_RATING",
  "SESSION_KEY_LIMIT",
  "STALE_VERSION",
  "TARGET_INACTIVE",
  "TDH_NOT_APPLIED",
  "UNDERPRICED",
  "VALIDITY_TOO_LONG",
  "WORK_EXHAUSTED",
  "WRONG_WALLET",
  "WRONG_NETWORK",
]);

/** Names that mean the payer had too little $fake6529. */
const FEE_NAMES = new Set(["FEE_UNCOVERED", "INSUFFICIENT_BALANCE"]);

/** "0x2101 ADDRESS_BOUND, detail 1", as the gateway and the relay word it. */
const NAMED_CODE = /\b0x[0-9a-fA-F]{4} ([A-Z][A-Z0-9_]+)\b/;
const DETAIL = /\b0x[0-9a-fA-F]{4} [A-Z][A-Z0-9_]+, detail (\d+)\b/;

/**
 * FEE_UNCOVERED's three causes, by its detail: header field n is detail
 * `(0x100 + n) << 16`. Field 13 (maxFee): the fee limit signed is below the
 * fee now; field 5 (authRef): the browser key's fee budget is spent; 0: the
 * payer's balance is short.
 */
const FEE_LIMIT_DETAIL = (0x100 + 13) * 0x10000;
const FEE_KEY_DETAIL = (0x100 + 5) * 0x10000;

const USER_REJECTION = /user (rejected|denied)/i;

const isUserRejection = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const { name, code, message } = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
  };
  return (
    name === "UserRejectedRequestError" ||
    code === 4001 ||
    (typeof message === "string" && USER_REJECTION.test(message))
  );
};

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : "";

const statusOf = (error: unknown): number | null => {
  if (error instanceof ChainGatewayError) {
    return error.status;
  }
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : null;
};

/** The chain's name for the refusal, when the error carries one. */
export function chainRefusalName(error: unknown): string | null {
  if (error instanceof ChainOperationError && error.resultName) {
    return error.resultName;
  }
  return NAMED_CODE.exec(messageOf(error))?.[1] ?? null;
}

const refusalDetail = (error: unknown): number | null => {
  const match = DETAIL.exec(messageOf(error));
  return match?.[1] === undefined ? null : Number(match[1]);
};

/** Why the chain wouldn't take the fee: FEE_UNCOVERED's three causes. */
export function feeRefusalCause(
  error: unknown
): "limit" | "key" | "balance" | null {
  if (chainRefusalName(error) !== "FEE_UNCOVERED") {
    return null;
  }
  const detail = refusalDetail(error);
  if (detail === FEE_LIMIT_DETAIL) {
    return "limit";
  }
  return detail === FEE_KEY_DETAIL ? "key" : "balance";
}

/** FEE_UNCOVERED split by its cause; other names as they are. */
const refusalKey = (error: unknown, name: string): string => {
  if (name !== "FEE_UNCOVERED") {
    return name;
  }
  const detail = refusalDetail(error);
  if (detail === FEE_LIMIT_DETAIL) {
    return "FEE_UNCOVERED_LIMIT";
  }
  if (detail === FEE_KEY_DETAIL) {
    return "FEE_UNCOVERED_KEY";
  }
  return name;
};

/** Whether the refusal means the payer had too little $fake6529 for the fee. */
export const isFeeShortfall = (error: unknown): boolean => {
  const name = chainRefusalName(error);
  return name !== null && FEE_NAMES.has(refusalKey(error, name));
};

/** 6529.io's relay, not the 6529 Network, answered with an error. */
function relayErrorMessage(
  locale: SupportedLocale,
  error: ChainRelayError
): string {
  const { status } = error;
  if (status === 401 || status === 403) {
    return t(locale, "chainIdentity.error.relaySignIn");
  }
  if (status === 400 && error.hold) {
    return t(locale, "chainIdentity.error.relayHoldRefused");
  }
  if (status === 400 || status === 404 || status === 409) {
    return t(locale, "chainIdentity.error.relayClosed");
  }
  if (status === 502) {
    return t(locale, "chainIdentity.error.relayNoNetwork");
  }
  if (status === 0 || status >= 500) {
    return t(locale, "chainIdentity.error.relayDown");
  }
  return t(locale, "chainIdentity.error.generic");
}

/** The reason to show, or null when the person declined in the wallet. */
export function chainErrorMessage(
  locale: SupportedLocale,
  error: unknown
): string | null {
  if (isUserRejection(error)) {
    return null;
  }
  if (error instanceof ChainRelayError) {
    return relayErrorMessage(locale, error);
  }
  const name = chainRefusalName(error);
  if (name !== null) {
    const key = refusalKey(error, name);
    const values =
      error instanceof ChainOperationError ? error.values : undefined;
    return KNOWN_NAMES.has(key)
      ? t(locale, `chainIdentity.error.${key}` as MessageKey, values)
      : t(locale, "chainIdentity.error.refused", { name });
  }
  const status = statusOf(error);
  if (status === 413) {
    return t(locale, "chainIdentity.error.tooLarge");
  }
  if (status === 0) {
    return t(locale, "chainIdentity.error.noGateway");
  }
  if (status === 429) {
    return t(locale, "chainIdentity.error.rateLimited");
  }
  if (status !== null && status >= 500) {
    return t(locale, "chainIdentity.error.busy");
  }
  if (
    error instanceof ChainOperationError &&
    error.reason === "draft_mismatch"
  ) {
    return t(locale, "chainIdentity.error.draftMismatch");
  }
  if (error instanceof ChainOperationError && error.reason === "timeout") {
    return t(locale, "chainIdentity.error.notFinalYet");
  }
  if (error instanceof ChainOperationError) {
    // These messages are this site's own, already in plain words.
    return error.message;
  }
  return t(locale, "chainIdentity.error.generic");
}

/**
 * What the page says after a change didn't go through: the reason, and
 * whether the fee was still paid (a change the chain ran and failed).
 */
export function chainFailureText(
  locale: SupportedLocale,
  error: unknown
): string {
  const reason = chainErrorMessage(locale, error);
  if (reason === null) {
    return t(locale, "chainIdentity.action.declined");
  }
  // Sent or kept, not refused: the reason says where it stands.
  if (
    error instanceof ChainOperationError &&
    (error.reason === "timeout" || error.reason === "stated")
  ) {
    return reason;
  }
  return error instanceof ChainOperationError && error.reason === "failed"
    ? t(locale, "chainIdentity.action.failedCharged", { reason })
    : t(locale, "chainIdentity.action.failed", { reason });
}

/**
 * A REP or NIC change on a profile page that the 6529 Network path didn't
 * complete, in plain words for the toast: never the generic sanitized text,
 * which reads any "network" or "wallet" error as a connection problem.
 */
export function chainRatingFailureText(
  locale: SupportedLocale,
  error: unknown
): string {
  const text = chainFailureText(locale, error);
  return isFeeShortfall(error)
    ? `${text} ${t(locale, "chainIdentity.rating.feeHint")}`
    : text;
}

/** Refusals no retry can fix: the rater or the profile has no identity yet. */
const NO_IDENTITY_NAMES = new Set(["NO_RATER_IDENTITY", "NO_TARGET_IDENTITY"]);

/**
 * Why a REP or NIC form can't offer a rating on the 6529 Network, when
 * trying again won't help; null for anything a retry may fix.
 */
export function chainRatingBlockedText(
  locale: SupportedLocale,
  error: unknown
): string | null {
  const name = chainRefusalName(error);
  return name !== null && NO_IDENTITY_NAMES.has(name)
    ? t(locale, `chainIdentity.error.${name}` as MessageKey)
    : null;
}
