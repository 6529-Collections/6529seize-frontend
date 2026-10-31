import * as Sentry from "@sentry/nextjs";

/** Which control started "Turn on signed messages". */
export type SignedMessagesEnableSource = "notice" | "renew" | "devices";

/** How the live wallet answers: a WalletConnect app or this browser. */
export type SignedMessagesEnableWallet = "remote" | "browser";

/** Steps of the flow, recorded as breadcrumbs only. */
type SignedMessagesEnableStep =
  | "start"
  | "reconnect-wait"
  | "connect-open"
  | "reconnect"
  | "network-switch"
  | "signature-requested"
  | "slow-wallet"
  | "enabled";

/** Outcomes that are the user's own choice; breadcrumbs only. */
type SignedMessagesEnableChoice =
  | "rejected"
  | "connect-cancelled"
  | "network-switch-rejected"
  | "account-changed";

/** Outcomes where the flow could not finish; also sent as a warning. */
export type SignedMessagesEnableFailure =
  | "unavailable"
  | "wallet-disconnected"
  | "wrong-account"
  | "wrong-network"
  | "connect-failed"
  | "device-key"
  | "challenge-failed"
  | "challenge-mismatch"
  | "signature-failed"
  | "walletconnect-session"
  | "walletconnect-no-answer"
  | "sign-in-failed"
  | "context-changed"
  | "unexpected";

export type SignedMessagesEnableEvent =
  | SignedMessagesEnableStep
  | SignedMessagesEnableChoice
  | SignedMessagesEnableFailure;

const CATEGORY = "device-signing";

const BREADCRUMB_ONLY = new Set<SignedMessagesEnableEvent>([
  "start",
  "reconnect-wait",
  "connect-open",
  "reconnect",
  "network-switch",
  "signature-requested",
  "slow-wallet",
  "enabled",
  "rejected",
  "connect-cancelled",
  "network-switch-rejected",
  "account-changed",
]);

/**
 * Records a step or outcome of "Turn on signed messages". Carries only the
 * source, the wallet kind and a reason code: never addresses, keys,
 * signatures or messages. Monitoring failures never affect the flow.
 */
export function reportSignedMessagesEnable(
  source: SignedMessagesEnableSource,
  event: SignedMessagesEnableEvent,
  wallet?: SignedMessagesEnableWallet
): void {
  try {
    const tags = {
      feature: CATEGORY,
      signed_messages_enable_source: source,
      signed_messages_enable_event: event,
      ...(wallet ? { signed_messages_enable_wallet: wallet } : {}),
    };
    const isFailure = !BREADCRUMB_ONLY.has(event);
    Sentry.addBreadcrumb({
      category: CATEGORY,
      level: isFailure ? "warning" : "info",
      message: `Turn on signed messages: ${event}`,
      data: tags,
    });
    if (!isFailure) {
      return;
    }
    Sentry.withScope((scope) => {
      scope.setLevel("warning");
      scope.setFingerprint([CATEGORY, "enable", event]);
      // Drop inherited context so the event carries only these codes.
      scope.addEventProcessor((sentryEvent) => {
        const bounded = { ...sentryEvent, tags, extra: {} };
        delete bounded.breadcrumbs;
        delete bounded.request;
        delete bounded.user;
        delete bounded.contexts;
        delete bounded.transaction;
        return bounded;
      });
      Sentry.captureMessage(`Turn on signed messages failed (${event})`);
    });
  } catch {
    // Monitoring must not change the flow.
  }
}
