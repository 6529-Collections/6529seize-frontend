import Image from "next/image";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { formatAddress } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useAuth } from "../auth/Auth";
import { getConnectionProfileIndicator } from "../auth/connection-state-indicator";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import UserLevel from "../user/utils/level/UserLevel";
import AppSidebarConnectedAccounts from "./AppSidebarConnectedAccounts";
import AppSidebarUserStats from "./AppSidebarUserStats";

export default function AppSidebarUserInfo() {
  const {
    address,
    isAuthenticated,
    isConnected,
    connectedAccountUnreadNotifications,
  } = useSeizeConnectContext();
  const { activeProfileProxy } = useAuth();
  const { profile } = useIdentity({
    handleOrWallet: address ?? null,
    initialProfile: null,
  });
  const connectionIndicator = getConnectionProfileIndicator({
    isAuthenticated,
    isConnected,
  });

  const handleOrWallet = (() => {
    if (activeProfileProxy)
      return (
        activeProfileProxy.created_by.handle ??
        activeProfileProxy.created_by.primary_address
      );
    if (profile?.handle) return profile.handle;
    if (address) return address;
    return "";
  })();

  const label = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.handle;
    if (profile?.handle) return profile.handle;
    if (address) return address.slice(0, 6);
    return "";
  })();
  const connectedWalletLabel = address ? formatAddress(address) : null;

  const pfp = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp;
    return profile?.pfp ?? null;
  })();

  const resolvedPfp = pfp && resolveIpfsUrlSync(pfp);
  const shouldShowFallbackPfp = Boolean(address || activeProfileProxy);
  const avatarSrc =
    resolvedPfp ??
    (shouldShowFallbackPfp ? DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP : null);
  const trimmedHandleOrWallet = handleOrWallet.trim();
  const avatarAltText = trimmedHandleOrWallet
    ? `${trimmedHandleOrWallet}'s profile picture`
    : "User's profile picture";

  const source = activeProfileProxy?.created_by ?? profile;
  const unreadNotificationsCount = address
    ? connectedAccountUnreadNotifications[address.toLowerCase()] ?? 0
    : 0;
  const showUnreadBadge = unreadNotificationsCount > 0;
  const unreadBadgeLabel =
    unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount;

  const level = source?.level ?? 0;
  const tdh = source?.tdh ?? 0;
  const tdh_rate = source?.tdh_rate ?? 0;
  const rep = source?.rep ?? 0;
  const xtdh = source?.xtdh ?? 0;
  const xtdh_rate = source?.xtdh_rate ?? 0;
  const cic = source?.cic ?? 0;

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-3 tw-py-2">
      <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
        {avatarSrc ? (
          <div className="tw-relative tw-h-12 tw-w-12">
            <div
              className={`tw-relative tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-full ${connectionIndicator.avatarClassName}`}
              title={connectionIndicator.title}
            >
              <Image
                src={avatarSrc}
                alt={avatarAltText}
                fill
                sizes="48px"
                className={`tw-rounded-full tw-bg-iron-900 ${
                  resolvedPfp
                    ? "tw-object-contain"
                    : "tw-object-cover tw-grayscale"
                }`}
              />
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
        ) : (
          <div
            className={`tw-h-12 tw-w-12 tw-rounded-full ${connectionIndicator.avatarClassName}`}
            title={connectionIndicator.title}
          />
        )}
        <AppSidebarConnectedAccounts />
      </div>
      <div className="tw-flex tw-flex-col tw-items-start">
        <span className="tw-truncate tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-text-lg">
          {label}
        </span>
        {connectedWalletLabel && (
          <span className="tw-my-1 tw-block tw-truncate tw-text-xs tw-font-medium tw-text-iron-400">
            {connectedWalletLabel}
          </span>
        )}
        <div className="tw-my-1">
          <UserLevel level={level} size="xs" />
        </div>
      </div>
      <AppSidebarUserStats
        handle={handleOrWallet}
        tdh={tdh}
        tdh_rate={tdh_rate}
        xtdh={xtdh}
        xtdh_rate={xtdh_rate}
        rep={rep}
        cic={cic}
        profileId={profile?.id ?? null}
      />
    </div>
  );
}
