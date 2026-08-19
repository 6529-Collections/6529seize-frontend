"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useConnect } from "wagmi";
import { CreateAppWalletModal } from "@/components/app-wallets/AppWalletModal";
import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { getConnectionShareRoute } from "@/components/header/share/connectionShareQr";
import {
  getQRScannerErrorReason,
  isQRScannerCancellation,
  scanQrCode,
} from "@/components/header/share/qrScanner.utils";
import { publicEnv } from "@/config/env";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { logError } from "@/utils/security-logger";
import { APP_WALLET_CONNECTOR_TYPE } from "@/wagmiConfig/wagmiAppWalletConnector";
import { normalizeAddress } from "./seizeConnectWalletState";
import CapacitorConnectDialog, {
  type CapacitorConnectDialogView,
} from "./CapacitorConnectDialog";

const OPTIONS_VIEW = "options" as const;
const APP_WALLETS_VIEW = "app-wallets" as const;

export default function CapacitorConnectFlow({
  view,
  setView,
  disconnectExternalWallet,
  openExternalWallets,
  onHandoffStateChange,
}: Readonly<{
  view: CapacitorConnectDialogView;
  setView: (view: CapacitorConnectDialogView) => void;
  disconnectExternalWallet: () => Promise<void>;
  openExternalWallets: () => Promise<void>;
  onHandoffStateChange: (isPending: boolean) => void;
}>) {
  const { connectAsync, connectors } = useConnect();
  const router = useRouter();
  const capacitor = useCapacitor();
  const locale = useBrowserLocale();
  const { appWallets, appWalletsSupported, fetchingAppWallets } =
    useAppWallets();
  const [isCreatingAppWallet, setIsCreatingAppWallet] = useState(false);
  const [busyAppWalletAddress, setBusyAppWalletAddress] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const afterLeaveActionRef = useRef<(() => void) | null>(null);

  const queueHandoff = useCallback(
    (action: () => void): void => {
      afterLeaveActionRef.current = action;
      onHandoffStateChange(true);
      setView("closed");
    },
    [onHandoffStateChange, setView]
  );

  const finishHandoff = useCallback((): void => {
    onHandoffStateChange(false);
  }, [onHandoffStateChange]);

  const showError = useCallback(
    (
      message: string,
      destinationView: Exclude<CapacitorConnectDialogView, "closed">
    ): void => {
      setErrorMessage(message);
      setView(destinationView);
    },
    [setView]
  );

  const handleOpenExternalWallets = useCallback((): void => {
    queueHandoff(() => {
      void (async () => {
        try {
          await disconnectExternalWallet();
          await openExternalWallets();
        } catch (error) {
          logError(
            "capacitorExternalWallets",
            error instanceof Error
              ? error
              : new Error("External wallet connection failed", {
                  cause: error,
                })
          );
          showError(
            t(locale, "capacitorConnect.error.connectionFailed"),
            OPTIONS_VIEW
          );
        } finally {
          finishHandoff();
        }
      })();
    });
  }, [
    disconnectExternalWallet,
    finishHandoff,
    locale,
    openExternalWallets,
    queueHandoff,
    showError,
  ]);

  const handleConnectAppWallet = useCallback(
    (address: string): void => {
      const connector = connectors.find(
        (candidate) =>
          candidate.type === APP_WALLET_CONNECTOR_TYPE &&
          normalizeAddress(candidate.id) === normalizeAddress(address)
      );
      if (!connector) {
        showError(
          t(locale, "capacitorConnect.error.connectionFailed"),
          APP_WALLETS_VIEW
        );
        return;
      }

      setBusyAppWalletAddress(address);
      queueHandoff(() => {
        void (async () => {
          try {
            await disconnectExternalWallet();
            await connectAsync({ connector });
          } catch (error) {
            logError(
              "capacitorAppWalletConnect",
              error instanceof Error
                ? error
                : new Error("App Wallet connection failed", { cause: error })
            );
            showError(
              t(locale, "capacitorConnect.error.connectionFailed"),
              APP_WALLETS_VIEW
            );
          } finally {
            setBusyAppWalletAddress(null);
            finishHandoff();
          }
        })();
      });
    },
    [
      connectAsync,
      connectors,
      disconnectExternalWallet,
      finishHandoff,
      locale,
      queueHandoff,
      showError,
    ]
  );

  const handleCreateAppWallet = useCallback((): void => {
    queueHandoff(() => {
      setIsCreatingAppWallet(true);
    });
  }, [queueHandoff]);

  const handleAppWalletNavigation = useCallback(
    (href: string): void => {
      setErrorMessage(null);
      queueHandoff(() => {
        try {
          router.push(href);
        } finally {
          finishHandoff();
        }
      });
    },
    [finishHandoff, queueHandoff, router]
  );

  const handleImportAppWallet = useCallback((): void => {
    handleAppWalletNavigation("/tools/app-wallets/import-wallet");
  }, [handleAppWalletNavigation]);

  const handleViewAppWallets = useCallback((): void => {
    handleAppWalletNavigation("/tools/app-wallets");
  }, [handleAppWalletNavigation]);

  const handleScanConnectionQr = useCallback((): void => {
    queueHandoff(() => {
      void (async () => {
        try {
          const content = await scanQrCode({
            isAndroid: capacitor.isAndroid,
            scanInstructions: t(
              locale,
              "capacitorConnect.connectionQr.instructions"
            ),
          });
          if (!content) {
            showError(
              t(locale, "capacitorConnect.connectionQr.invalid"),
              OPTIONS_VIEW
            );
            return;
          }

          const route = getConnectionShareRoute({
            content,
            appScheme: publicEnv.MOBILE_APP_SCHEME ?? "mobile6529",
          });
          if (!route) {
            showError(
              t(locale, "capacitorConnect.connectionQr.invalid"),
              OPTIONS_VIEW
            );
            return;
          }

          try {
            router.push(route);
          } catch (error) {
            logError(
              "capacitorConnectionShareNavigation",
              error instanceof Error
                ? error
                : new Error("Connection-share navigation failed", {
                    cause: error,
                  })
            );
            showError(
              t(locale, "capacitorConnect.error.navigationFailed"),
              OPTIONS_VIEW
            );
          }
        } catch (error) {
          if (isQRScannerCancellation(error)) {
            setView(OPTIONS_VIEW);
            return;
          }
          logError(
            "capacitorConnectionQrScan",
            error instanceof Error
              ? error
              : new Error(
                  getQRScannerErrorReason(error) ?? "QR scanner failed",
                  { cause: error }
                )
          );
          showError(t(locale, "qrScanner.error.scanFailed"), OPTIONS_VIEW);
        } finally {
          finishHandoff();
        }
      })();
    });
  }, [
    capacitor.isAndroid,
    finishHandoff,
    locale,
    queueHandoff,
    router,
    setView,
    showError,
  ]);

  return (
    <>
      <CapacitorConnectDialog
        view={view}
        locale={locale}
        appWallets={appWallets}
        appWalletsSupported={appWalletsSupported}
        fetchingAppWallets={fetchingAppWallets}
        busyWalletAddress={busyAppWalletAddress}
        errorMessage={errorMessage}
        onClose={() => {
          setErrorMessage(null);
          setView("closed");
        }}
        onBack={() => {
          setErrorMessage(null);
          setView(OPTIONS_VIEW);
        }}
        onOpenAppWallets={() => {
          setErrorMessage(null);
          setView(APP_WALLETS_VIEW);
        }}
        onOpenExternalWallets={handleOpenExternalWallets}
        onScanConnectionQr={handleScanConnectionQr}
        onCreateAppWallet={handleCreateAppWallet}
        onImportAppWallet={handleImportAppWallet}
        onViewAppWallets={handleViewAppWallets}
        onConnectAppWallet={handleConnectAppWallet}
        onAfterLeave={() => {
          const action = afterLeaveActionRef.current;
          afterLeaveActionRef.current = null;
          action?.();
        }}
      />
      <CreateAppWalletModal
        show={isCreatingAppWallet}
        onHide={() => {
          setIsCreatingAppWallet(false);
          setView(APP_WALLETS_VIEW);
          finishHandoff();
        }}
      />
    </>
  );
}
