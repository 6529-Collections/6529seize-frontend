"use client";

import { getConnectionProfileIndicator } from "@/components/auth/connection-state-indicator";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP } from "@/constants/constants";
import { formatAddress } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";

interface ConnectedAccountItem {
  readonly address: string;
  readonly isActive: boolean;
  readonly isConnected: boolean;
}

function ConnectedAccountRow({
  account,
  onSelect,
}: {
  readonly account: ConnectedAccountItem;
  readonly onSelect: (address: string) => void;
}) {
  const { profile, isLoading: isProfileLoading } = useIdentity({
    handleOrWallet: account.address,
    initialProfile: null,
  });

  const connectionIndicator = getConnectionProfileIndicator({
    isAuthenticated: true,
    isConnected: account.isConnected,
  });

  const resolvedPfp = profile?.pfp ? resolveIpfsUrlSync(profile.pfp) : null;
  const shouldShowFallbackPfp = !isProfileLoading && !resolvedPfp;
  const avatarSrc =
    resolvedPfp ??
    (shouldShowFallbackPfp ? DEFAULT_CONNECTED_PROFILE_FALLBACK_PFP : null);
  const label =
    profile?.handle ??
    `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  const walletLabel = formatAddress(account.address);

  return (
    <button
      type="button"
      onClick={() => onSelect(account.address)}
      className={`tw-group tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-px-3 tw-py-2.5 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
        account.isActive
          ? "tw-bg-iron-700"
          : "tw-bg-transparent hover:tw-bg-iron-700"
      }`}
      aria-label={`Switch to ${label} (${walletLabel})`}
    >
      <div
        className={`tw-relative tw-size-8 tw-flex-none tw-overflow-hidden tw-rounded-lg ${connectionIndicator.avatarClassName}`}
        title={connectionIndicator.title}
      >
        {avatarSrc && (
          <img
            src={avatarSrc}
            alt={`${label} profile picture`}
            className={`tw-absolute tw-inset-0 tw-block tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out ${
              resolvedPfp ? "tw-object-contain" : "tw-object-cover tw-grayscale"
            }`}
          />
        )}
        {connectionIndicator.overlayClassName && (
          <div
            className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-rounded-lg ${connectionIndicator.overlayClassName}`}
          />
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
        {account.isActive && (
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
    </button>
  );
}

export default function HeaderUserConnectedAccounts({
  accounts,
  onSelectAccount,
  canAddAccount,
  onAddAccount,
}: {
  readonly accounts: readonly ConnectedAccountItem[];
  readonly onSelectAccount: (address: string) => void;
  readonly canAddAccount: boolean;
  readonly onAddAccount: () => void;
}) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <p className="tw-m-0 tw-px-3 tw-pt-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
        Connected Profiles
      </p>
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        {accounts.map((account) => (
          <ConnectedAccountRow
            key={account.address.toLowerCase()}
            account={account}
            onSelect={onSelectAccount}
          />
        ))}
        {canAddAccount && (
          <button
            type="button"
            onClick={onAddAccount}
            className="tw-group tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
            aria-label="Add account"
          >
            <div className="tw-flex tw-h-6 tw-w-6 tw-flex-none tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-700 tw-text-iron-200 tw-ring-1 tw-ring-iron-500">
              +
            </div>
            <div className="tw-inline-flex tw-w-full tw-items-center tw-justify-between tw-truncate">
              <span className="tw-text-md tw-font-medium tw-text-white">
                Add
              </span>
              <span className="tw-ml-2 tw-h-5 tw-w-5" aria-hidden="true" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
