import DeviceSecurityStatus from "@/components/device-signing/DeviceSecurityStatus";
import Image from "next/image";
import Link from "next/link";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useIdentity } from "@/hooks/useIdentity";
import { t } from "@/i18n/messages";
import { useAuth } from "../auth/Auth";
import { getConnectionProfileIndicator } from "../auth/connection-state-indicator";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import UserLevel from "../user/utils/level/UserLevel";
import AppSidebarConnectedAccounts from "./AppSidebarConnectedAccounts";
import AppSidebarUserStats from "./AppSidebarUserStats";

interface AppSidebarUserInfoProps {
  readonly onNavigate?: (() => void) | undefined;
}

export default function AppSidebarUserInfo({
  onNavigate,
}: AppSidebarUserInfoProps) {
  const locale = useBrowserLocale();
  const {
    address,
    hasValidWalletAuth: isAuthenticated,
    isConnected,
    connectedAccountUnreadNotifications,
  } = useSeizeConnectContext();
  const { activeProfileProxy, setToast } = useAuth();
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
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setToast({
        message: t(locale, "appSidebar.addressCopied"),
        type: "success",
      });
    } catch {
      setToast({
        message: t(locale, "appSidebar.addressCopyFailed"),
        type: "error",
      });
    }
  };

  const pfp = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp;
    return profile?.pfp ?? null;
  })();

  const resolvedPfp = pfp && getScaledImageUri(pfp, ImageScale.W_AUTO_H_50);
  const shouldShowFallbackPfp = Boolean(address ?? activeProfileProxy);
  const avatarSrc =
    resolvedPfp ??
    (shouldShowFallbackPfp ? DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP : null);
  const trimmedHandleOrWallet = handleOrWallet.trim();
  const avatarAltText = trimmedHandleOrWallet
    ? `${trimmedHandleOrWallet}'s profile picture`
    : "User's profile picture";

  const source = activeProfileProxy?.created_by ?? profile;
  const unreadNotificationsCount = address
    ? (connectedAccountUnreadNotifications[address.toLowerCase()] ?? 0)
    : 0;
  const showUnreadBadge = unreadNotificationsCount > 0;
  const unreadBadgeLabel =
    unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount;
  const profileRouteHandleOrWallet = trimmedHandleOrWallet.toLowerCase();
  const profileHref = profileRouteHandleOrWallet
    ? `/${encodeURIComponent(profileRouteHandleOrWallet)}`
    : "/profile";
  const trimmedProfileLinkLabel = label?.trim() ?? "";
  const profileLinkLabel =
    trimmedProfileLinkLabel.length > 0 ? trimmedProfileLinkLabel : "user";
  const profileLinkClickProps = onNavigate ? { onClick: onNavigate } : {};

  const level = source?.level ?? 0;
  const tdh = source?.tdh ?? 0;
  const tdh_rate = source?.tdh_rate ?? 0;
  const rep = source?.rep ?? 0;
  const xtdh = source?.xtdh ?? 0;
  const xtdh_rate = source?.xtdh_rate ?? 0;
  const cic = source?.cic ?? 0;

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-3 tw-py-2">
      <div className="tw-flex tw-w-full tw-items-start tw-gap-2">
        <div className="tw-flex tw-min-w-0 tw-flex-col">
          <Link
            href={profileHref}
            {...profileLinkClickProps}
            aria-label={t(locale, "appSidebar.openProfile", {
              name: profileLinkLabel,
            })}
            className="tw-inline-flex tw-self-start tw-rounded-lg tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900"
          >
            <div className="tw-flex tw-items-center tw-gap-2">
              {avatarSrc ? (
                <div className="tw-relative tw-h-12 tw-w-12">
                  <div
                    className={`tw-relative tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-full ${connectionIndicator.avatarClassName}`}
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
                  {isAuthenticated && !activeProfileProxy && (
                    <DeviceSecurityStatus presentation="mobile-badge" />
                  )}
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
            </div>
          </Link>
          <div className="tw-mt-3 tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <Link
              href={profileHref}
              {...profileLinkClickProps}
              className="tw-truncate tw-rounded-sm tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-text-lg"
            >
              {label}
            </Link>
            <UserLevel level={level} size="xxs" showLabel={false} circle />
          </div>
          {address && (
            <button
              type="button"
              onClick={() => void copyAddress()}
              aria-label={t(locale, "appSidebar.copyAddress")}
              className="tw-self-start tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-1 tw-font-mono tw-text-xs tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {shortenAddress(address)}
            </button>
          )}
        </div>
        <AppSidebarConnectedAccounts onNavigate={onNavigate} />
      </div>
      {isAuthenticated && !activeProfileProxy && (
        <DeviceSecurityStatus
          presentation="inline"
          connection={connectionIndicator}
        />
      )}
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
