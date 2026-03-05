"use client";

import { getConnectionProfileIndicator } from "@/components/auth/connection-state-indicator";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { useIdentity } from "@/hooks/useIdentity";

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

export default function AppSidebarConnectedAccounts() {
  const {
    connectedAccounts,
    connectedAccountUnreadNotifications,
    canAddConnectedAccount,
    seizeAddConnectedAccount,
    seizeSwitchConnectedAccount,
  } = useSeizeConnectContext();
  const availableConnectedAccounts = connectedAccounts ?? [];

  const additionalAccounts = availableConnectedAccounts.filter(
    (account) => !account.isActive
  );
  if (additionalAccounts.length === 0 && !canAddConnectedAccount) {
    return null;
  }

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
          onSelect={seizeSwitchConnectedAccount}
        />
      ))}
      {canAddConnectedAccount ? (
        <button
          type="button"
          onClick={seizeAddConnectedAccount}
          className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-100 tw-ring-1 tw-ring-iron-500 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          aria-label="Add account"
          title="Add account"
        >
          <span className="tw-text-2xl tw-leading-none">+</span>
        </button>
      ) : null}
    </div>
  );
}
