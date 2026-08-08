"use client";

import { useState } from "react";
import { getConnectionProfileIndicator } from "@/components/auth/connection-state-indicator";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { formatAddress } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface ConnectedAccountItem {
  readonly address: string;
  readonly isActive: boolean;
  readonly isConnected: boolean;
  readonly unreadNotificationsCount?: number | undefined;
}

const MAX_BADGE_COUNT = 99;
const HEADER_USER_MENU_LOCALE = DEFAULT_LOCALE;

function ConnectedAccountRow({
  account,
  onSelect,
  showActiveState,
  actionsDisabled,
}: {
  readonly account: ConnectedAccountItem;
  readonly onSelect: (address: string) => void;
  readonly showActiveState: boolean;
  readonly actionsDisabled: boolean;
}) {
  const { profile, isLoading: isProfileLoading } = useIdentity({
    handleOrWallet: account.address,
    initialProfile: null,
  });

  const connectionIndicator = getConnectionProfileIndicator({
    isAuthenticated: true,
    isConnected: account.isConnected,
  });

  const [failedPfpSrc, setFailedPfpSrc] = useState<string | null>(null);
  const resolvedPfp = profile?.pfp ? resolveIpfsUrlSync(profile.pfp) : null;
  const hasPfpError = Boolean(resolvedPfp && resolvedPfp === failedPfpSrc);
  const shouldShowFallbackPfp =
    hasPfpError || (!isProfileLoading && !resolvedPfp);
  const avatarSrc =
    resolvedPfp ??
    (shouldShowFallbackPfp ? DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP : null);
  const label =
    profile?.handle ??
    `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  const walletLabel = formatAddress(account.address);
  const unreadCount = account.unreadNotificationsCount ?? 0;
  const showUnreadBadge = unreadCount > 0;
  const unreadBadgeLabel =
    unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount;

  const rowContent = (
    <>
      <div className="tw-relative tw-size-8 tw-flex-none">
        <div
          className={`tw-relative tw-size-8 tw-overflow-hidden tw-rounded-lg ${connectionIndicator.avatarClassName}`}
          title={connectionIndicator.title}
        >
          {avatarSrc && (
            <img
              src={avatarSrc}
              alt={label}
              onError={(event) => {
                if (resolvedPfp && failedPfpSrc !== resolvedPfp) {
                  setFailedPfpSrc(resolvedPfp);
                  event.currentTarget.src =
                    DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP;
                }
              }}
              className={`tw-absolute tw-inset-0 tw-block tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out ${
                resolvedPfp
                  ? "tw-object-contain"
                  : "tw-object-cover tw-grayscale"
              }`}
            />
          )}
          {connectionIndicator.overlayClassName && (
            <div
              className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-rounded-lg ${connectionIndicator.overlayClassName}`}
            />
          )}
        </div>
        {showUnreadBadge && (
          <div className="tw-absolute tw-right-[-8px] tw-top-[-8px] tw-flex tw-h-4 tw-min-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-500 tw-px-1 tw-text-[10px] tw-font-medium tw-text-white tw-shadow-sm">
            {unreadBadgeLabel}
          </div>
        )}
      </div>

      <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-leading-tight">
          <span className="tw-w-full tw-truncate tw-text-md tw-font-medium tw-text-white">
            {label}
          </span>
          <span className="tw-w-full tw-truncate tw-text-[11px] tw-font-medium tw-text-iron-400">
            {walletLabel}
          </span>
        </div>
        {showActiveState && account.isActive && (
          <svg
            className="tw-ml-2 tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </>
  );

  const rowClassName = `tw-group tw-relative tw-flex tw-h-full tw-w-full tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-px-3 tw-py-2.5 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out ${
    showActiveState && account.isActive ? "tw-bg-iron-700" : "tw-bg-transparent"
  }`;

  if (!showActiveState) {
    return <div className={rowClassName}>{rowContent}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(account.address)}
      disabled={actionsDisabled}
      className={`${rowClassName} tw-cursor-pointer hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-50`}
      aria-label={t(HEADER_USER_MENU_LOCALE, "headerUserMenu.switchToProfile", {
        profile: label,
        wallet: walletLabel,
      })}
    >
      {rowContent}
    </button>
  );
}

export default function HeaderUserConnectedAccounts({
  accounts,
  onSelectAccount,
  canAddAccount,
  onAddAccount,
  onSignOutAll,
  actionsDisabled,
}: {
  readonly accounts: readonly ConnectedAccountItem[];
  readonly onSelectAccount: (address: string) => void;
  readonly canAddAccount: boolean;
  readonly onAddAccount: () => void;
  readonly onSignOutAll: () => void;
  readonly actionsDisabled: boolean;
}) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-min-h-8 tw-items-center tw-justify-between tw-gap-2 tw-px-3 tw-pt-1">
        <div className="tw-flex tw-items-center tw-gap-1">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            {t(HEADER_USER_MENU_LOCALE, "headerUserMenu.profiles")}
          </p>
          {canAddAccount && (
            <button
              type="button"
              onClick={onAddAccount}
              disabled={actionsDisabled}
              aria-label={t(
                HEADER_USER_MENU_LOCALE,
                "headerUserMenu.addProfile"
              )}
              title={t(HEADER_USER_MENU_LOCALE, "headerUserMenu.addProfile")}
              className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-lg tw-font-medium tw-leading-none tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-700 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-50"
            >
              <span aria-hidden="true">+</span>
            </button>
          )}
        </div>
        {accounts.length > 1 && (
          <button
            type="button"
            onClick={onSignOutAll}
            disabled={actionsDisabled}
            className="tw-inline-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-700 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-50"
          >
            {t(HEADER_USER_MENU_LOCALE, "headerUserMenu.signOutAll")}
          </button>
        )}
      </div>
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        {accounts.map((account) => (
          <ConnectedAccountRow
            key={account.address.toLowerCase()}
            account={account}
            onSelect={onSelectAccount}
            showActiveState={accounts.length > 1}
            actionsDisabled={actionsDisabled}
          />
        ))}
      </div>
    </div>
  );
}
