import DeviceSetupMenuAction from "@/components/device-signing/DeviceSetupMenuAction";
import { isDeviceSecurityStatusEnabled } from "@/components/device-signing/DeviceSecurityStatus";
import HeaderBookmarksLink from "./user/HeaderBookmarksLink";
import {
  faPlugCircleMinus,
  faPlugCirclePlus,
  faPlugCircleXmark,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowPathRoundedSquareIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import BellIcon from "@/components/common/icons/BellIcon";
import { useContext, useState } from "react";
import { AuthContext } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import Button from "../utils/button/Button";
import PushNotificationSettings from "./PushNotificationSettings";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import HeaderQRScanner from "./share/HeaderQRScanner";
import { useChainSwitcher } from "./useChainSwitcher";
import { signOutAndRemoveLocalData } from "@/components/auth/signOutLocalData";
import { DisplayedProfileChangedError } from "@/services/auth/displayed-wallet-guard";
import Link from "next/link";

export default function AppUserConnect({
  onNavigate,
  onSignOut,
}: {
  readonly onNavigate: () => void;
  readonly onSignOut: (signOut: () => void) => void;
}) {
  const {
    address,
    hasValidWalletAuth,
    isConnected,
    connectedAccounts,
    seizeConnectFresh,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeDisconnectAndLogoutAll,
  } = useSeizeConnectContext();
  const { activeProfileProxy, setToast } = useContext(AuthContext);
  const locale = useBrowserLocale();
  const [isPushSettingsOpen, setIsPushSettingsOpen] = useState(false);
  const [isOpeningConnection, setIsOpeningConnection] = useState(false);
  const { chains, currentChainName, nextChainName, switchToNextChain } =
    useChainSwitcher();
  const availableConnectedAccounts = connectedAccounts ?? [];
  const logoutLabel = t(
    locale,
    isConnected ? "appSidebar.disconnectAndLogout" : "headerUserMenu.logout"
  );

  const runAsyncAction = async ({
    action,
    errorMessage,
    onSettled,
  }: {
    readonly action: () => void | Promise<void>;
    readonly errorMessage: string;
    readonly onSettled?: () => void;
  }) => {
    try {
      await Promise.resolve(action());
    } catch (error) {
      console.error(errorMessage, error);
      let errorDetails = "";
      if (error instanceof Error) {
        errorDetails = error.message;
      } else if (typeof error === "string") {
        errorDetails = error;
      }
      let toastMessage = errorDetails
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;
      if (error instanceof DisplayedProfileChangedError) {
        toastMessage = error.message;
      }
      setToast({ message: toastMessage, type: "error" });
    } finally {
      onSettled?.();
    }
  };

  const qrScanner = <HeaderQRScanner onScanSuccess={onNavigate} appSidebar />;

  const onSwitchChain = () => {
    if (switchToNextChain()) {
      onNavigate();
    }
  };

  const connectButton = (
    <Button
      onClick={() => {
        // The first click can still be loading the wallet connection services.
        setIsOpeningConnection(true);
        void runAsyncAction({
          action: seizeConnectFresh,
          errorMessage: t(locale, "appSidebar.connectFailed"),
          onSettled: onNavigate,
        }).finally(() => setIsOpeningConnection(false));
      }}
      type="button"
      variant="action"
      size="lg"
      loading={isOpeningConnection}
      fullWidth
    >
      <span>{t(locale, "appSidebar.connect")}</span>
    </Button>
  );

  const walletConnectionButton = isConnected ? (
    <button
      onClick={() => {
        void runAsyncAction({
          action: seizeDisconnect,
          errorMessage: t(locale, "appSidebar.disconnectWalletFailed"),
          onSettled: onNavigate,
        });
      }}
      className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
    >
      <FontAwesomeIcon
        icon={faPlugCircleMinus}
        className="tw-h-6 tw-w-6 tw-flex-shrink-0"
      />
      <span>{t(locale, "appSidebar.disconnectWallet")}</span>
    </button>
  ) : (
    <button
      onClick={() => {
        void runAsyncAction({
          action: seizeConnectFresh,
          errorMessage: t(locale, "appSidebar.connectFailed"),
          onSettled: onNavigate,
        });
      }}
      className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
    >
      <FontAwesomeIcon
        icon={faPlugCirclePlus}
        className="tw-h-6 tw-w-6 tw-flex-shrink-0"
      />
      <span>{t(locale, "appSidebar.connectWallet")}</span>
    </button>
  );

  const authorizedButtons = (
    <>
      <HeaderBookmarksLink onClose={onNavigate} />
      <Link
        href="/preferences"
        onClick={onNavigate}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        aria-label={t(locale, "profilePreferences.button")}
      >
        <FontAwesomeIcon
          icon={faSliders}
          className="tw-h-6 tw-w-6 tw-flex-shrink-0"
        />
        <span>{t(locale, "profilePreferences.button")}</span>
      </Link>
      {isDeviceSecurityStatusEnabled() && (
        <DeviceSetupMenuAction
          mobile
          onClose={onNavigate}
          showStatus={!hasValidWalletAuth || Boolean(activeProfileProxy)}
        />
      )}
      <button
        type="button"
        onClick={() => setIsPushSettingsOpen(true)}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
      >
        <BellIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
        <span>{t(locale, "appSidebar.pushNotifications")}</span>
      </button>
      {walletConnectionButton}
      {isConnected && chains.length > 1 && (
        <div>
          <span className="tw-relative tw-flex tw-h-full tw-w-full tw-select-none tw-px-4 tw-py-0.5 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out">
            {t(locale, "appSidebar.network", { chain: currentChainName })}
          </span>
          <button
            onClick={onSwitchChain}
            className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
          >
            <ArrowPathRoundedSquareIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
            <span>
              {t(locale, "appSidebar.switchChain", { chain: nextChainName })}
            </span>
          </button>
        </div>
      )}
      <button
        onClick={() => {
          onSignOut(() => {
            void runAsyncAction({
              action: () =>
                signOutAndRemoveLocalData("profile", seizeDisconnectAndLogout),
              errorMessage: t(locale, "auth.signOut.error.disconnectAndLogout"),
            });
          });
        }}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
      >
        <ArrowRightEndOnRectangleIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
        <span>{logoutLabel}</span>
      </button>
      {availableConnectedAccounts.length > 1 && (
        <button
          onClick={() => {
            onSignOut(() => {
              void runAsyncAction({
                action: () =>
                  signOutAndRemoveLocalData("all", seizeDisconnectAndLogoutAll),
                errorMessage: t(locale, "auth.signOut.error.allProfiles"),
              });
            });
          }}
          className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        >
          <FontAwesomeIcon
            icon={faPlugCircleXmark}
            className="tw-h-6 tw-w-6 tw-flex-shrink-0"
          />
          <span>{t(locale, "appSidebar.signOutAllProfiles")}</span>
        </button>
      )}
      <PushNotificationSettings
        isOpen={isPushSettingsOpen}
        onClose={() => setIsPushSettingsOpen(false)}
      />
    </>
  );

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-space-y-2">
      {qrScanner}
      {address ? authorizedButtons : connectButton}
    </div>
  );
}
