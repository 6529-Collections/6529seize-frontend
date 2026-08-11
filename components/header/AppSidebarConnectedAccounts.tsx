"use client";

import { getConnectionProfileIndicator } from "@/components/auth/connection-state-indicator";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { useIdentity } from "@/hooks/useIdentity";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth/Auth";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

function AppSidebarConnectedAccountAvatar({
  address,
  isConnected,
  unreadNotificationsCount,
  onSelect,
}: {
  readonly address: string;
  readonly isConnected: boolean;
  readonly unreadNotificationsCount: number;
  readonly onSelect: (address: string) => void;
}) {
  const { profile, isLoading: isProfileLoading } = useIdentity({
    handleOrWallet: address,
    initialProfile: null,
  });
  const connectionIndicator = getConnectionProfileIndicator({
    isAuthenticated: true,
    isConnected,
  });
  const resolvedPfp = profile?.pfp ? resolveIpfsUrlSync(profile.pfp) : null;
  const shouldShowFallbackPfp = !isProfileLoading && !resolvedPfp;
  const avatarSrc =
    resolvedPfp ??
    (shouldShowFallbackPfp ? DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP : null);
  const label =
    profile?.handle ?? `${address.slice(0, 6)}...${address.slice(-4)}`;
  const showUnreadBadge = unreadNotificationsCount > 0;
  const unreadBadgeLabel =
    unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount;

  return (
    <button
      type="button"
      onClick={() => onSelect(address)}
      className="tw-cursor-pointer tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      aria-label={`Switch to ${label}`}
      title={`${label} • ${connectionIndicator.title}`}
    >
      <div className="tw-relative tw-h-12 tw-w-12">
        <div
          className={`tw-relative tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-full ${connectionIndicator.avatarClassName}`}
        >
          {avatarSrc && (
            <img
              src={avatarSrc}
              alt={label}
              className={`tw-absolute tw-inset-0 tw-block tw-h-full tw-w-full tw-rounded-full tw-bg-iron-900 ${
                resolvedPfp
                  ? "tw-object-contain"
                  : "tw-object-cover tw-grayscale"
              }`}
            />
          )}
          {connectionIndicator.overlayClassName && (
            <div
              className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-rounded-full ${connectionIndicator.overlayClassName}`}
            />
          )}
        </div>
        {showUnreadBadge && (
          <div className="tw-absolute tw-right-[-4px] tw-top-[-4px] tw-flex tw-h-4 tw-min-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-500 tw-px-1 tw-text-[10px] tw-font-medium tw-text-white tw-shadow-sm">
            {unreadBadgeLabel}
          </div>
        )}
      </div>
    </button>
  );
}

export default function AppSidebarConnectedAccounts({
  onNavigate,
}: {
  readonly onNavigate?: (() => void) | undefined;
}) {
  const {
    connectedAccounts,
    connectedAccountUnreadNotifications,
    canAddConnectedAccount,
    seizeAddConnectedAccount,
    seizeSwitchConnectedAccount,
    seizeConnectOpen,
  } = useSeizeConnectContext();
  const { setToast } = useAuth();
  const availableConnectedAccounts = connectedAccounts ?? [];

  const additionalAccounts = availableConnectedAccounts.filter(
    (account) => !account.isActive
  );
  if (additionalAccounts.length === 0 && !canAddConnectedAccount) {
    return null;
  }

  const handleSelectAccount = (address: string): void => {
    try {
      seizeSwitchConnectedAccount(address);
      onNavigate?.();
    } catch (error) {
      console.error("Failed to switch connected account:", error);
      setToast({
        message: t(DEFAULT_LOCALE, "appSidebar.accountSwitchFailed"),
        type: "error",
      });
    }
  };

  const handleAddAccount = (): void => {
    if (seizeConnectOpen) {
      return;
    }
    try {
      seizeAddConnectedAccount();
      onNavigate?.();
    } catch (error) {
      console.error("Failed to open connected account flow:", error);
      setToast({
        message: t(DEFAULT_LOCALE, "appSidebar.accountConnectionFailed"),
        type: "error",
      });
    }
  };

  const addAccountLabel = t(DEFAULT_LOCALE, "headerUserMenu.addProfile");
  const openingAccountLabel = t(
    DEFAULT_LOCALE,
    "appSidebar.openingAccountConnection"
  );

  return (
    <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
      {additionalAccounts.map((account) => (
        <AppSidebarConnectedAccountAvatar
          key={account.address.toLowerCase()}
          address={account.address}
          isConnected={account.isConnected}
          unreadNotificationsCount={
            connectedAccountUnreadNotifications[
              account.address.toLowerCase()
            ] ?? 0
          }
          onSelect={handleSelectAccount}
        />
      ))}
      {canAddConnectedAccount ? (
        <button
          type="button"
          onClick={handleAddAccount}
          disabled={seizeConnectOpen}
          className="tw-touch-action-manipulation tw-flex tw-h-12 tw-w-12 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-100 tw-ring-1 tw-ring-iron-500 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-iron-700 disabled:tw-cursor-wait disabled:tw-opacity-60"
          aria-busy={seizeConnectOpen}
          aria-label={seizeConnectOpen ? openingAccountLabel : addAccountLabel}
          title={seizeConnectOpen ? openingAccountLabel : addAccountLabel}
        >
          {seizeConnectOpen ? (
            <ArrowPathIcon
              className="tw-size-5 tw-animate-spin motion-reduce:tw-animate-none"
              aria-hidden="true"
            />
          ) : (
            <span className="tw-text-2xl tw-leading-none" aria-hidden="true">
              +
            </span>
          )}
        </button>
      ) : null}
    </div>
  );
}
