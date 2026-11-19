"use client";

import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { getBrowserConnectorStatus } from "@/services/desktop/browserConnectorSignIn";

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

export type DesktopConnectProblem =
  | "start-failed"
  | "walletconnect-failed"
  | null;

/** Shared rendering for the desktop controller and its local UI preview. */
export default function DesktopConnectDialogView({
  isOpen,
  isBusy,
  status,
  problem,
  onClose,
  onBrowserWallet,
  onWalletConnect,
  onCancel,
}: {
  readonly isOpen: boolean;
  readonly isBusy: boolean;
  readonly status: ReturnType<typeof getBrowserConnectorStatus>;
  readonly problem: DesktopConnectProblem;
  readonly onClose: () => void;
  readonly onBrowserWallet: () => void;
  readonly onWalletConnect: () => void;
  readonly onCancel: () => void;
}) {
  const locale = useBrowserLocale();
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
      onClose={onClose}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-pb-2 tw-pt-3 sm:tw-px-6">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "desktopConnect.intro")}
        </p>
        <Option
          label={t(locale, "desktopConnect.browserWallet")}
          description={t(locale, "desktopConnect.browserWalletDescription")}
          icon={<GlobeAltIcon aria-hidden="true" className="tw-size-6" />}
          onClick={onBrowserWallet}
          disabled={isBusy}
          opensBrowser
        />
        <Option
          label={t(locale, "desktopConnect.walletConnect")}
          description={t(locale, "desktopConnect.walletConnectDescription")}
          icon={<QrCodeIcon aria-hidden="true" className="tw-size-6" />}
          onClick={onWalletConnect}
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
          <button type="button" className={SECONDARY_CLASS} onClick={onCancel}>
            {t(locale, "desktopConnect.cancel")}
          </button>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
