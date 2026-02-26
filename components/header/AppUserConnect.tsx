import {
  ArrowRightEndOnRectangleIcon,
  ArrowsRightLeftIcon,
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
  const { address, seizeConnect, seizeDisconnectAndLogout } =
    useSeizeConnectContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const connectedButtons = (
    <>
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        aria-label="Push Notifications"
      >
        <Cog6ToothIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
        <span>Push Notifications</span>
      </button>
      <button
        onClick={() => {
          seizeDisconnectAndLogout(true);
          onNavigate();
        }}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        aria-label="Switch Account"
      >
        <ArrowsRightLeftIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
        <span>Switch Account</span>
      </button>
      <button
        onClick={() => {
          seizeDisconnectAndLogout();
          onNavigate();
        }}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        aria-label="Disconnect & Logout"
      >
        <ArrowRightEndOnRectangleIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
        <span>Disconnect & Logout</span>
      </button>
      <PushNotificationSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-space-y-2">
      {qrScanner}
      {address ? connectedButtons : connectButton}
    </div>
  );
}
