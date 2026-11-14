"use client";

import {
  ChevronRightIcon,
  GlobeAltIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useSyncExternalStore } from "react";
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
  getDesktopConnectDialogOpener,
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
}: {
  readonly label: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}) {
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
      <ChevronRightIcon
        aria-hidden="true"
        className="tw-size-5 tw-flex-none tw-text-iron-500"
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
 * The 6529 Desktop connect choice: scan with a mobile wallet
 * (WalletConnect), or sign in with a browser wallet through the browser
 * connector. Seed wallets of the older desktop app are not offered: they
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
  const [startFailed, setStartFailed] = useState(false);
  const isOpen = openWalletConnect !== null;
  const isBusy = status === "waiting" || status === "signing-in";

  // A finished browser sign-in closes the choice.
  useEffect(() => {
    if (isOpen && status === "signed-in") closeDesktopConnectDialog();
  }, [isOpen, status]);

  const close = () => {
    if (status === "waiting") cancelBrowserConnectorSignIn();
    setStartFailed(false);
    closeDesktopConnectDialog();
  };

  const chooseWalletConnect = () => {
    if (!openWalletConnect) return;
    closeDesktopConnectDialog();
    openWalletConnect().catch(() => undefined);
  };

  const chooseBrowserWallet = () => {
    setStartFailed(false);
    startBrowserConnectorSignIn().catch(() => setStartFailed(true));
  };

  const statusKey =
    status in STATUS_MESSAGES
      ? STATUS_MESSAGES[status as keyof typeof STATUS_MESSAGES]
      : null;

  return (
    <MobileWrapperDialog
      isOpen={isOpen}
      title={t(locale, "desktopConnect.title")}
      onClose={close}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-pb-2">
        <Option
          label={t(locale, "desktopConnect.walletConnect")}
          description={t(locale, "desktopConnect.walletConnectDescription")}
          icon={<QrCodeIcon aria-hidden="true" className="tw-size-6" />}
          onClick={chooseWalletConnect}
          disabled={isBusy}
        />
        <Option
          label={t(locale, "desktopConnect.browserWallet")}
          description={t(locale, "desktopConnect.browserWalletDescription")}
          icon={<GlobeAltIcon aria-hidden="true" className="tw-size-6" />}
          onClick={chooseBrowserWallet}
          disabled={isBusy}
        />
        {startFailed && (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-red">
            {t(locale, "desktopConnect.status.startFailed")}
          </p>
        )}
        {statusKey !== null &&
          (status === "failed" || status === "expired" ? (
            <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-200">
              {t(locale, statusKey)}
            </p>
          ) : (
            <output
              aria-live="polite"
              className="tw-block tw-text-sm tw-text-iron-200"
            >
              {t(locale, statusKey)}
            </output>
          ))}
        {status === "waiting" && (
          <button
            type="button"
            className={SECONDARY_CLASS}
            onClick={cancelBrowserConnectorSignIn}
          >
            {t(locale, "desktopConnect.cancel")}
          </button>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
