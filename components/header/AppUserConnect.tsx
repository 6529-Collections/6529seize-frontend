import {
  faPlugCircleMinus,
  faPlugCirclePlus,
  faPlugCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowRightEndOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import PushNotificationSettings from "./PushNotificationSettings";
import HeaderQRScanner from "./share/HeaderQRScanner";

export default function AppUserConnect({
  onNavigate,
}: {
  readonly onNavigate: () => void;
}) {
  const {
    address,
    isConnected,
    connectedAccounts,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeDisconnectAndLogoutAll,
  } = useSeizeConnectContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const availableConnectedAccounts = connectedAccounts ?? [];

  const runAsyncAndNavigate = async ({
    action,
    errorMessage,
  }: {
    readonly action: () => void | Promise<void>;
    readonly errorMessage: string;
  }) => {
    try {
      await Promise.resolve(action());
    } catch (error) {
      console.error(errorMessage, error);
    } finally {
      onNavigate();
    }
  };

  const qrScanner = <HeaderQRScanner onScanSuccess={onNavigate} appSidebar />;

  const connectButton = (
    <button
      onClick={() => {
        seizeConnect();
        onNavigate();
      }}
      type="button"
      className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-leading-6 tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-300 hover:tw-bg-primary-600 hover:tw-ring-primary-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset"
    >
      <span>Connect</span>
    </button>
  );

  const walletConnectionButton = isConnected ? (
    <button
      onClick={() => {
        void runAsyncAndNavigate({
          action: seizeDisconnect,
          errorMessage: "Failed to disconnect wallet",
        });
      }}
      className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
      aria-label="Disconnect Wallet"
    >
      <FontAwesomeIcon
        icon={faPlugCircleMinus}
        className="tw-h-6 tw-w-6 tw-flex-shrink-0"
      />
      <span>Disconnect Wallet</span>
    </button>
  ) : (
    <button
      onClick={() => {
        seizeConnect();
        onNavigate();
      }}
      className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
      aria-label="Connect Wallet"
    >
      <FontAwesomeIcon
        icon={faPlugCirclePlus}
        className="tw-h-6 tw-w-6 tw-flex-shrink-0"
      />
      <span>Connect Wallet</span>
    </button>
  );

  const authorizedButtons = (
    <>
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        aria-label="Push Notifications"
      >
        <Cog6ToothIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
        <span>Push Notifications</span>
      </button>
      {walletConnectionButton}
      <button
        onClick={() => {
          void runAsyncAndNavigate({
            action: seizeDisconnectAndLogout,
            errorMessage: "Failed to disconnect and logout",
          });
        }}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        aria-label={isConnected ? "Disconnect & Logout" : "Logout"}
      >
        <ArrowRightEndOnRectangleIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
        <span>{isConnected ? "Disconnect & Logout" : "Logout"}</span>
      </button>
      {availableConnectedAccounts.length > 1 && (
        <button
          onClick={() => {
            void runAsyncAndNavigate({
              action: seizeDisconnectAndLogoutAll,
              errorMessage: "Failed to sign out all profiles",
            });
          }}
          className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
          aria-label="Sign Out All Profiles"
        >
          <FontAwesomeIcon
            icon={faPlugCircleXmark}
            className="tw-h-6 tw-w-6 tw-flex-shrink-0"
          />
          <span>Sign Out All Profiles</span>
        </button>
      )}
      <PushNotificationSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
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
