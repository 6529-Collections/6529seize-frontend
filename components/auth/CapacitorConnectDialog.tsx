"use client";

import {
  ChevronRightIcon,
  GlobeAltIcon,
  QrCodeIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import AppWalletActionButton from "@/components/app-wallets/AppWalletActionButton";
import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import Image from "next/image";

export type CapacitorConnectDialogView = "closed" | "options" | "app-wallets";

type ActionRowProps = {
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly ariaLabel?: string | undefined;
};

function ActionRow({
  label,
  icon,
  onClick,
  disabled = false,
  ariaLabel,
}: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className="tw-group tw-flex tw-min-h-14 tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-left tw-text-base tw-font-medium tw-text-iron-50 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800"
    >
      <span className="tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 group-active:tw-text-iron-50">
        {icon}
      </span>
      <span className="tw-min-w-0 tw-flex-1 tw-truncate">{label}</span>
      <ChevronRightIcon
        aria-hidden="true"
        className="tw-size-5 tw-flex-none tw-text-iron-500"
      />
    </button>
  );
}

function AppWalletRows({
  locale,
  appWallets,
  appWalletsSupported,
  fetchingAppWallets,
  busyWalletAddress,
  onConnectAppWallet,
}: Readonly<{
  locale: SupportedLocale;
  appWallets: AppWallet[];
  appWalletsSupported: boolean;
  fetchingAppWallets: boolean;
  busyWalletAddress: string | null;
  onConnectAppWallet: (address: string) => void;
}>) {
  if (fetchingAppWallets) {
    return (
      <output className="tw-m-0 tw-block tw-py-4 tw-text-center tw-text-sm tw-text-iron-500">
        {t(locale, "capacitorConnect.appWallets.loading")}
      </output>
    );
  }

  if (!appWalletsSupported) {
    return (
      <output className="tw-m-0 tw-block tw-py-4 tw-text-center tw-text-sm tw-text-iron-500">
        {t(locale, "capacitorConnect.appWallets.unavailable")}
      </output>
    );
  }

  if (appWallets.length === 0) {
    return (
      <output className="tw-m-0 tw-block tw-py-4 tw-text-center tw-text-sm tw-text-iron-500">
        {t(locale, "capacitorConnect.appWallets.empty")}
      </output>
    );
  }

  return appWallets.map((wallet) => (
    <ActionRow
      key={wallet.address.toLowerCase()}
      label={`${wallet.name} (${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)})`}
      ariaLabel={t(locale, "capacitorConnect.appWallets.connectAriaLabel", {
        walletName: wallet.name,
        shortAddress: `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`,
      })}
      icon={
        <Image
          unoptimized
          src={`https://robohash.org/${wallet.address}.png?size=64x64`}
          alt=""
          width={36}
          height={36}
          className="tw-size-9 tw-rounded-md"
        />
      }
      disabled={busyWalletAddress !== null}
      onClick={() => onConnectAppWallet(wallet.address)}
    />
  ));
}

export default function CapacitorConnectDialog({
  view,
  locale,
  appWallets,
  appWalletsSupported,
  fetchingAppWallets,
  busyWalletAddress,
  errorMessage,
  onClose,
  onBack,
  onOpenAppWallets,
  onOpenExternalWallets,
  onScanConnectionQr,
  onCreateAppWallet,
  onImportAppWallet,
  onViewAppWallets,
  onConnectAppWallet,
  onAfterLeave,
}: Readonly<{
  view: CapacitorConnectDialogView;
  locale: SupportedLocale;
  appWallets: AppWallet[];
  appWalletsSupported: boolean;
  fetchingAppWallets: boolean;
  busyWalletAddress: string | null;
  errorMessage: string | null;
  onClose: () => void;
  onBack: () => void;
  onOpenAppWallets: () => void;
  onOpenExternalWallets: () => void;
  onScanConnectionQr: () => void;
  onCreateAppWallet: () => void;
  onImportAppWallet: () => void;
  onViewAppWallets: () => void;
  onConnectAppWallet: (address: string) => void;
  onAfterLeave: () => void;
}>) {
  const isAppWalletView = view === "app-wallets";

  return (
    <MobileWrapperDialog
      isOpen={view !== "closed"}
      title={
        isAppWalletView
          ? t(locale, "capacitorConnect.appWallets")
          : t(locale, "capacitorConnect.title")
      }
      onClose={onClose}
      onBack={isAppWalletView ? onBack : undefined}
      onAfterLeave={onAfterLeave}
      showHeaderCloseButton
      enableDragToClose
      maxWidthClass="md:tw-max-w-lg"
    >
      {isAppWalletView ? (
        <div className="tw-flex tw-flex-col tw-gap-4 tw-px-4 sm:tw-px-6">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "capacitorConnect.appWallets.description")}
          </p>
          <div className="tw-grid tw-grid-cols-2 tw-gap-2">
            <AppWalletActionButton
              action="create"
              onClick={onCreateAppWallet}
              disabled={!appWalletsSupported}
            >
              {t(locale, "capacitorConnect.appWallets.create")}
            </AppWalletActionButton>
            <AppWalletActionButton
              action="import"
              onClick={onImportAppWallet}
              disabled={!appWalletsSupported}
            >
              {t(locale, "capacitorConnect.appWallets.import")}
            </AppWalletActionButton>
          </div>
          <div className="tw-flex tw-max-h-[40svh] tw-flex-col tw-gap-2 tw-overflow-y-auto tw-pr-1 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
            <AppWalletRows
              locale={locale}
              appWallets={appWallets}
              appWalletsSupported={appWalletsSupported}
              fetchingAppWallets={fetchingAppWallets}
              busyWalletAddress={busyWalletAddress}
              onConnectAppWallet={onConnectAppWallet}
            />
          </div>
          <button
            type="button"
            onClick={onViewAppWallets}
            disabled={!appWalletsSupported}
            className="tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-transparent tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-900 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100"
          >
            <WalletIcon aria-hidden="true" className="tw-size-5" />
            {t(locale, "capacitorConnect.appWallets.viewAll")}
            <ChevronRightIcon aria-hidden="true" className="tw-size-4" />
          </button>
        </div>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-2 tw-px-4 tw-pt-3 sm:tw-px-6">
          <ActionRow
            label={t(locale, "capacitorConnect.appWallets")}
            icon={<WalletIcon aria-hidden="true" className="tw-size-6" />}
            onClick={onOpenAppWallets}
          />
          <ActionRow
            label={t(locale, "capacitorConnect.externalWallets")}
            icon={<GlobeAltIcon aria-hidden="true" className="tw-size-6" />}
            onClick={onOpenExternalWallets}
          />
          <ActionRow
            label={t(locale, "capacitorConnect.scanConnectionQr")}
            icon={<QrCodeIcon aria-hidden="true" className="tw-size-6" />}
            onClick={onScanConnectionQr}
          />
        </div>
      )}
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {errorMessage && (
          <p className="tw-mx-4 tw-mb-0 tw-mt-3 tw-rounded-lg tw-bg-red/10 tw-px-3 tw-py-2 tw-text-sm tw-text-red sm:tw-mx-6">
            {errorMessage}
          </p>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
