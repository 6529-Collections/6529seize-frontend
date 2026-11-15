"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
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
  unverified: "desktopWalletRequest.unverified",
  failed: "desktopWalletRequest.failed",
} as const;

/** Statuses after which the website itself is the way forward. */
const CONTINUE_IN_BROWSER = new Set(["refused", "unverified"]);

/**
 * "Open the page again", limited the way the shell limits it. Mounted per
 * request (keyed by its code), so a new request starts with no reopens.
 */
function ReopenButton({
  locale,
}: {
  readonly locale: ReturnType<typeof useBrowserLocale>;
}) {
  const [count, setCount] = useState(0);
  const [coolingDown, setCoolingDown] = useState(false);

  useEffect(() => {
    if (!coolingDown) return undefined;
    const timer = setTimeout(() => setCoolingDown(false), REOPEN_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [coolingDown]);

  if (count >= MAX_REOPENS) return null;
  return (
    <>
      <button
        type="button"
        className={PRIMARY_CLASS}
        disabled={coolingDown}
        onClick={() => {
          reopenDesktopWalletRequest();
          setCount(count + 1);
          setCoolingDown(true);
        }}
      >
        {t(locale, "desktopWalletRequest.reopen")}
      </button>
      {coolingDown && (
        <p className="tw-m-0 tw-w-full tw-text-sm tw-text-iron-300">
          {t(locale, "desktopWalletRequest.reopenWait")}
        </p>
      )}
    </>
  );
}

/**
 * While a wallet request waits in the browser: says where to finish, shows
 * the request code the browser page also shows, and offers to open the page
 * again or cancel. Afterwards it explains a cancelled, expired, busy,
 * refused, unverified or failed request, with "Continue in your browser"
 * where the website is the way forward. Renders nothing when no request is
 * open (always, outside 6529 Desktop with wallet forwarding).
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
    finishedMessage = t(locale, key, { site: getWebsiteHost() });
  }

  const close = () => {
    if (waiting) {
      cancelDesktopWalletRequest();
      return;
    }
    dismissDesktopWalletRequestStatus();
  };

  return (
    <MobileWrapperDialog
      isOpen={status.kind !== "idle"}
      title={t(locale, "desktopWalletRequest.title")}
      onClose={close}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-pb-2">
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
          {waiting ? t(locale, "desktopWalletRequest.waiting") : null}
        </output>
        {waiting && (
          <>
            <p className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400 tw-p-3 tw-text-base tw-font-semibold tw-text-white">
              {t(locale, "desktopWalletRequest.code", {
                code: status.requestCode,
              })}
            </p>
            <div className="tw-flex tw-flex-wrap tw-gap-3">
              <ReopenButton key={status.requestCode} locale={locale} />
              <button
                type="button"
                className={SECONDARY_CLASS}
                onClick={cancelDesktopWalletRequest}
              >
                {t(locale, "desktopWalletRequest.cancel")}
              </button>
            </div>
          </>
        )}
        {finished && (
          <div className="tw-flex tw-flex-wrap tw-gap-3">
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
          </div>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
