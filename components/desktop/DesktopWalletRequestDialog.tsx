"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AppWalletModalShell } from "@/components/app-wallets/AppWalletModalShell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getTransactionLink } from "@/helpers/Helpers";
import { t } from "@/i18n/messages";
import {
  continueInBrowser,
  getWebsiteHost,
} from "@/services/desktop/continueInBrowser";
import {
  cancelDesktopWalletRequest,
  dismissDesktopWalletRequestStatus,
  getDesktopWalletRequestStatus,
  getServerDesktopWalletRequestStatus,
  reopenDesktopWalletRequest,
  subscribeDesktopWalletRequestStatus,
} from "@/services/desktop/desktopBrowserWallet";

const PRIMARY_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";
const SECONDARY_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

/** The shell opens the page again at most once per 5 s, 3 times per request. */
const REOPEN_COOLDOWN_MS = 5000;
const MAX_REOPENS = 3;

const FINISHED_MESSAGES = {
  cancelled: "desktopWalletRequest.cancelled",
  expired: "desktopWalletRequest.expired",
  busy: "desktopWalletRequest.busy",
  refused: "desktopWalletRequest.refused",
  transaction: "desktopWalletRequest.transactionNotForwarded",
  transactionUpdate: "desktopWalletRequest.transactionUpdate",
  transactionUnverified: "desktopWalletRequest.transactionUnverified",
  transactionMismatch: "desktopWalletRequest.transactionMismatch",
  lateTransaction: "desktopWalletRequest.lateTransaction",
  unverified: "desktopWalletRequest.unverified",
  failed: "desktopWalletRequest.failed",
} as const;

/** Statuses after which the website itself is the way forward. */
const CONTINUE_IN_BROWSER = new Set([
  "refused",
  "transaction",
  "transactionUpdate",
  "unverified",
]);

type DialogStatus = ReturnType<typeof getDesktopWalletRequestStatus>;

const TRANSACTION_KINDS = new Set([
  "transaction",
  "transactionUpdate",
  "transactionUnverified",
  "transactionMismatch",
  "lateTransaction",
]);

/** Whether the dialog is about a transaction (titled "Transaction"). */
const isTransactionStatus = (status: DialogStatus): boolean =>
  TRANSACTION_KINDS.has(status.kind) ||
  (status.kind === "waiting" && status.transaction);

interface ReopenState {
  readonly requestCode: string | null;
  readonly count: number;
  readonly coolingDown: boolean;
}

/**
 * "Open the page again", limited the way the shell limits it. The count
 * belongs to one request: a new request code starts with no reopens.
 */
function useReopen(requestCode: string | null) {
  const [state, setState] = useState<ReopenState>({
    requestCode,
    count: 0,
    coolingDown: false,
  });
  const current: ReopenState =
    state.requestCode === requestCode
      ? state
      : { requestCode, count: 0, coolingDown: false };

  useEffect(() => {
    if (!current.coolingDown) return undefined;
    const timer = setTimeout(
      () =>
        setState((previous) =>
          previous.requestCode === requestCode
            ? { ...previous, coolingDown: false }
            : previous
        ),
      REOPEN_COOLDOWN_MS
    );
    return () => clearTimeout(timer);
  }, [current.coolingDown, requestCode]);

  return {
    canReopen: current.count < MAX_REOPENS,
    coolingDown: current.coolingDown,
    reopen: () => {
      reopenDesktopWalletRequest();
      setState({ requestCode, count: current.count + 1, coolingDown: true });
    },
  };
}

/**
 * While a wallet request waits in the browser: says where to finish, shows
 * the request code (and the content fingerprint, for drops and decisions)
 * the browser page also shows, and offers to open the page again or cancel.
 * Afterwards it explains a cancelled, expired, busy, refused, unverified or
 * failed request, or a transaction (which forwarding does not send), with
 * "Continue in your browser" where the website is the way forward. Renders
 * nothing when no request is open (always, outside 6529 Desktop with wallet
 * forwarding).
 *
 * It is the top modal layer: shown in the browser's top layer above every
 * app modal, with any focus trap underneath (the Terms of Service modal's,
 * for one) paused while it is open, so its controls are always reachable.
 */
export default function DesktopWalletRequestDialog() {
  const locale = useBrowserLocale();
  const status = useSyncExternalStore(
    subscribeDesktopWalletRequestStatus,
    getDesktopWalletRequestStatus,
    getServerDesktopWalletRequestStatus
  );
  const waiting = status.kind === "waiting";
  const finished = status.kind !== "idle" && !waiting;
  const reopen = useReopen(waiting ? status.requestCode : null);
  // "Continue in your browser" failed for this outcome (cleared on change).
  const [openFailedFor, setOpenFailedFor] = useState<typeof status | null>(
    null
  );
  const openFailed = openFailedFor === status;
  const setOpenFailed = (failed: boolean) =>
    setOpenFailedFor(failed ? status : null);
  let finishedMessage: string | null = null;
  if (finished) {
    const key = openFailed
      ? "desktopWalletRequest.openFailed"
      : FINISHED_MESSAGES[status.kind];
    finishedMessage = t(locale, key, {
      site: getWebsiteHost(),
      hash: "hash" in status ? status.hash : "",
    });
  }

  let waitingMessage: string | null = null;
  if (waiting) {
    waitingMessage = t(
      locale,
      status.transaction
        ? "desktopWalletRequest.transactionWaiting"
        : "desktopWalletRequest.waiting"
    );
  }

  const close = () => {
    if (waiting) {
      cancelDesktopWalletRequest();
      return;
    }
    dismissDesktopWalletRequestStatus();
  };

  let footer: React.ReactNode = null;
  if (waiting) {
    footer = (
      <>
        {reopen.canReopen && (
          <button
            type="button"
            className={PRIMARY_CLASS}
            disabled={reopen.coolingDown}
            onClick={reopen.reopen}
          >
            {t(locale, "desktopWalletRequest.reopen")}
          </button>
        )}
        <button
          type="button"
          className={SECONDARY_CLASS}
          onClick={cancelDesktopWalletRequest}
        >
          {t(locale, "desktopWalletRequest.cancel")}
        </button>
      </>
    );
  } else if (finished) {
    footer = (
      <>
        {"hash" in status && (
          <a
            href={getTransactionLink(status.chainId, status.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${SECONDARY_CLASS} tw-inline-flex tw-items-center tw-no-underline`}
          >
            {t(locale, "desktopWalletRequest.explorer")}
          </a>
        )}
        {CONTINUE_IN_BROWSER.has(status.kind) && (
          <button
            type="button"
            className={PRIMARY_CLASS}
            onClick={() => {
              // Stay open with the reason if the browser did not open.
              if (continueInBrowser()) {
                setOpenFailed(false);
                dismissDesktopWalletRequestStatus();
              } else {
                setOpenFailed(true);
              }
            }}
          >
            {t(locale, "desktopWalletRequest.continueInBrowser")}
          </button>
        )}
        <button
          type="button"
          className={SECONDARY_CLASS}
          onClick={dismissDesktopWalletRequestStatus}
        >
          {t(locale, "desktopWalletRequest.close")}
        </button>
      </>
    );
  }

  // Mounted only while there is something to show: never on the web.
  if (status.kind === "idle") return null;

  return (
    <AppWalletModalShell
      layered
      locale={locale}
      show
      title={t(
        locale,
        isTransactionStatus(status)
          ? "desktopWalletRequest.transactionTitle"
          : "desktopWalletRequest.title"
      )}
      onHide={close}
      footer={footer}
    >
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div
          role="alert"
          className="tw-text-sm tw-text-iron-200 empty:tw-hidden"
        >
          {finishedMessage}
        </div>
        <output
          aria-live="polite"
          aria-atomic="true"
          className="tw-block tw-text-sm tw-text-iron-200 empty:tw-hidden"
        >
          {waitingMessage}
        </output>
        {waiting && (
          <>
            <p className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400 tw-p-3 tw-text-base tw-font-semibold tw-text-white">
              {t(locale, "desktopWalletRequest.code", {
                code: status.requestCode,
              })}
            </p>
            {status.fingerprint !== null && (
              <p className="tw-m-0 tw-text-sm tw-text-iron-200">
                {t(locale, "desktopWalletRequest.fingerprint", {
                  fingerprint: status.fingerprint,
                })}
              </p>
            )}
            {reopen.coolingDown && reopen.canReopen && (
              <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                {t(locale, "desktopWalletRequest.reopenWait")}
              </p>
            )}
          </>
        )}
      </div>
    </AppWalletModalShell>
  );
}
