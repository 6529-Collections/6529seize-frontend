"use client";

import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  cancelBrowserConnectorSignIn,
  getBrowserConnectorStatus,
  getServerBrowserConnectorStatus,
  startBrowserConnectorSignIn,
  subscribeBrowserConnectorStatus,
} from "@/services/desktop/browserConnectorSignIn";
import {
  closeDesktopConnectDialog,
  finishDesktopConnectHandoff,
  getDesktopConnectDialogOpener,
  getDesktopConnectPickerVersion,
  getDesktopWalletSetup,
  openDesktopConnectDialog,
  getServerDesktopConnectDialogOpener,
  subscribeDesktopConnectDialog,
} from "@/services/desktop/desktopConnectDialog";

const OPTION_CLASS =
  "tw-group tw-flex tw-min-h-14 tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-left tw-text-base tw-font-medium tw-text-iron-50 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800";
const SECONDARY_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

function Option({
  label,
  description,
  icon,
  onClick,
  disabled = false,
  opensBrowser = false,
}: {
  readonly label: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  /** Shows the leave-the-app mark instead of the chevron. */
  readonly opensBrowser?: boolean;
}) {
  const TrailingIcon = opensBrowser
    ? ArrowTopRightOnSquareIcon
    : ChevronRightIcon;
  return (
    <button
      type="button"
      className={OPTION_CLASS}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-300">
        {icon}
      </span>
      <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
        <span>{label}</span>
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          {description}
        </span>
      </span>
      <TrailingIcon
        aria-hidden="true"
        className="tw-size-5 tw-flex-none tw-text-iron-400"
      />
    </button>
  );
}

const STATUS_MESSAGES = {
  waiting: "desktopConnect.status.waiting",
  "signing-in": "desktopConnect.status.signingIn",
  failed: "desktopConnect.status.failed",
  expired: "desktopConnect.status.expired",
} as const;

/**
 * The 6529 Desktop connect choice: sign in with a browser wallet through the
 * browser connector (it opens the system browser, where extensions such as
 * MetaMask live), or scan a QR code with a phone wallet (WalletConnect). Seed wallets of the older desktop app are not offered: they
 * exposed private keys to the page. Renders nothing until the shared connect
 * flow opens it, which happens only inside 6529 Desktop.
 */
export default function DesktopConnectDialog() {
  const locale = useBrowserLocale();
  const openWalletConnect = useSyncExternalStore(
    subscribeDesktopConnectDialog,
    getDesktopConnectDialogOpener,
    getServerDesktopConnectDialogOpener
  );
  const status = useSyncExternalStore(
    subscribeBrowserConnectorStatus,
    getBrowserConnectorStatus,
    getServerBrowserConnectorStatus
  );
  const [problem, setProblem] = useState<
    "start-failed" | "walletconnect-failed" | null
  >(null);
  // The browser sign-in start in flight, set synchronously so a double click
  // starts only one. Closing clears it; a cleared attempt's result is ignored.
  const startAttempt = useRef<{ picker: number } | null>(null);
  const [startingPicker, setStartingPicker] = useState<number | null>(null);
  const picker = getDesktopConnectPickerVersion();
  const isOpen = openWalletConnect !== null;
  const isStarting = isOpen && startingPicker === picker;
  const isBusy = isStarting || status === "waiting" || status === "signing-in";

  // A finished browser sign-in closes the choice.
  useEffect(() => {
    if (isOpen && status === "signed-in")
      closeDesktopConnectDialog("signed-in");
  }, [isOpen, status]);

  // Waiting for the browser can be cancelled. Once the app is signing in
  // with the returned signature, closing (the dialog's own Close button or
  // Escape) only hides the dialog: the sign-in finishes on its own.
  const close = () => {
    // Also while the start is still asking the shell for its scheme (the
    // status is idle then), so the browser does not open after closing.
    if (!getDesktopWalletSetup() && (status === "waiting" || isStarting)) {
      cancelBrowserConnectorSignIn();
    }
    startAttempt.current = null;
    setStartingPicker(null);
    setProblem(null);
    closeDesktopConnectDialog(status === "signing-in" ? "hidden" : "cancelled");
  };

  const chooseWalletConnect = () => {
    const open = openWalletConnect;
    if (!open) return;
    const setup = getDesktopWalletSetup();
    setProblem(null);
    closeDesktopConnectDialog("walletconnect");
    open()
      .then(() => {
        finishDesktopConnectHandoff(picker, "walletconnect");
      })
      .catch(() => {
        if (!finishDesktopConnectHandoff(picker, "failed")) return;
        // Bring the unscoped choice back with the reason.
        if (
          !setup &&
          getDesktopConnectPickerVersion() === picker &&
          getDesktopConnectDialogOpener() === null
        ) {
          openDesktopConnectDialog(open);
          setProblem("walletconnect-failed");
        }
      });
  };

  const chooseBrowserWallet = () => {
    if (startAttempt.current?.picker === picker) return;
    const attempt = { picker };
    const stillStarting = () =>
      startAttempt.current === attempt &&
      getDesktopConnectPickerVersion() === picker &&
      getDesktopConnectDialogOpener() !== null;
    startAttempt.current = attempt;
    setStartingPicker(picker);
    setProblem(null);
    const setup = getDesktopWalletSetup();
    startBrowserConnectorSignIn(setup)
      .catch(() => {
        if (!stillStarting()) return;
        if (setup) setup.onStatus("failed");
        else setProblem("start-failed");
      })
      .finally(() => {
        if (!stillStarting()) return;
        startAttempt.current = null;
        setStartingPicker(null);
      });
  };

  let alertText: string | null = null;
  if (problem === "start-failed") {
    alertText = t(locale, "desktopConnect.status.startFailed");
  } else if (problem === "walletconnect-failed") {
    alertText = t(locale, "desktopConnect.status.walletConnectFailed");
  } else if (status === "failed" || status === "expired") {
    alertText = t(locale, STATUS_MESSAGES[status]);
  }
  const statusText =
    status === "waiting" || status === "signing-in"
      ? t(locale, STATUS_MESSAGES[status])
      : null;

  return (
    <MobileWrapperDialog
      isOpen={isOpen}
      title={t(locale, "desktopConnect.title")}
      onClose={close}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-pb-2 tw-pt-3 sm:tw-px-6">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "desktopConnect.intro")}
        </p>
        <Option
          label={t(locale, "desktopConnect.browserWallet")}
          description={t(locale, "desktopConnect.browserWalletDescription")}
          icon={<GlobeAltIcon aria-hidden="true" className="tw-size-6" />}
          onClick={chooseBrowserWallet}
          disabled={isBusy}
          opensBrowser
        />
        <Option
          label={t(locale, "desktopConnect.walletConnect")}
          description={t(locale, "desktopConnect.walletConnectDescription")}
          icon={<QrCodeIcon aria-hidden="true" className="tw-size-6" />}
          onClick={chooseWalletConnect}
          disabled={isBusy}
        />
        {/* Both live regions stay in the dialog; only their text changes. */}
        <div
          role="alert"
          className="tw-text-sm tw-text-iron-200 empty:tw-hidden"
        >
          {alertText}
        </div>
        <output
          aria-live="polite"
          aria-atomic="true"
          className="tw-block tw-text-sm tw-text-iron-200 empty:tw-hidden"
        >
          {statusText}
        </output>
        {status === "waiting" && (
          <button
            type="button"
            className={SECONDARY_CLASS}
            onClick={() => {
              if (getDesktopWalletSetup()) close();
              else cancelBrowserConnectorSignIn();
            }}
          >
            {t(locale, "desktopConnect.cancel")}
          </button>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
