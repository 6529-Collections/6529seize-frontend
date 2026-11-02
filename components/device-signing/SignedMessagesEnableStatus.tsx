"use client";

import Button from "@/components/utils/button/Button";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US";
import {
  isReconnectStatus,
  type SignedMessagesEnableError,
  type SignedMessagesEnableStatus as EnableStatus,
} from "./signedMessagesEnableFlow";

const ERROR_KEYS: Readonly<Record<SignedMessagesEnableError, MessageKey>> = {
  "connect-failed": "signedMessages.enable.error.connectFailed",
  "device-key": "signedMessages.enable.error.deviceKey",
  "challenge-failed": "signedMessages.enable.error.challengeFailed",
  "challenge-mismatch": "signedMessages.enable.unavailable",
  "signature-failed": "signedMessages.enable.error.signatureFailed",
  "walletconnect-session": "signedMessages.enable.error.walletConnectSession",
  "sign-in-failed": "signedMessages.enable.error.signInFailed",
  "context-changed": "signedMessages.enable.error.contextChanged",
  unavailable: "signedMessages.enable.unavailable",
  unexpected: "signedMessages.enable.unavailable",
};

const PROGRESS_KEYS = {
  reconnecting: "signedMessages.enable.status.reconnecting",
  connecting: "signedMessages.enable.status.connecting",
  rejected: "signedMessages.enable.status.rejected",
  "not-connected": "signedMessages.enable.status.notConnected",
  stalled: "signedMessages.enable.status.stalled",
} as const satisfies Record<string, MessageKey>;

interface StatusMessage {
  readonly text: string;
  /** Real failures are alerts; progress and the user's own choices are not. */
  readonly isError: boolean;
}

function getStatusMessage(
  locale: SupportedLocale,
  status: EnableStatus
): StatusMessage {
  switch (status.kind) {
    case "waiting":
      return {
        text: t(
          locale,
          status.remote
            ? "signedMessages.enable.status.waitingRemote"
            : "signedMessages.enable.status.waiting"
        ),
        isError: false,
      };
    case "slow":
      return {
        text: t(
          locale,
          status.remote
            ? "signedMessages.enable.status.slowRemote"
            : "signedMessages.enable.status.slow"
        ),
        isError: false,
      };
    case "switching-network":
      return {
        text: t(locale, "signedMessages.enable.status.switchingNetwork", {
          network: status.network,
        }),
        isError: false,
      };
    case "wrong-network":
      return status.canceled
        ? {
            text: t(
              locale,
              "signedMessages.enable.status.networkSwitchCanceled",
              { network: status.network }
            ),
            isError: false,
          }
        : {
            text: t(locale, "signedMessages.enable.error.wrongNetwork", {
              network: status.network,
            }),
            isError: true,
          };
    case "wrong-account":
      return {
        text: t(locale, "signedMessages.enable.error.wrongAccount", {
          address: shortenAddress(status.address),
        }),
        isError: true,
      };
    case "error":
      return { text: t(locale, ERROR_KEYS[status.reason]), isError: true };
    case "reconnecting":
    case "connecting":
    case "rejected":
    case "not-connected":
    case "stalled":
      return { text: t(locale, PROGRESS_KEYS[status.kind]), isError: false };
  }
}

interface SignedMessagesEnableStatusProps {
  readonly status: EnableStatus | null;
  readonly onReconnect: () => void;
  readonly className?: string | undefined;
}

/**
 * What "Turn on signed messages" is doing or why it stopped. Progress uses a
 * polite live region that is always present, so changes are announced; real
 * failures are alerts. A wrong account, or a WalletConnect wallet that does
 * not answer, offers "Reconnect wallet".
 */
export default function SignedMessagesEnableStatus({
  status,
  onReconnect,
  className = "",
}: SignedMessagesEnableStatusProps) {
  const locale = useBrowserLocale();
  const message = status ? getStatusMessage(locale, status) : null;
  const textClass = "tw-m-0 tw-text-pretty tw-text-xs tw-leading-5";

  // The margin applies only with a message, so an idle status adds no space.
  return (
    <div className={message ? className : undefined}>
      <output
        aria-live="polite"
        className={`tw-block ${textClass} tw-text-iron-300`}
      >
        {message && !message.isError ? message.text : null}
      </output>
      {message?.isError && (
        <p role="alert" className={`${textClass} tw-text-red`}>
          {message.text}
        </p>
      )}
      {isReconnectStatus(status) && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onReconnect}
          className="tw-mt-2"
        >
          {t(locale, "signedMessages.enable.reconnect")}
        </Button>
      )}
    </div>
  );
}
