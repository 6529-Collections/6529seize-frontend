"use client";

import type { WalletConsolidationState } from "@/entities/IProfile";
import { useContext, useMemo, useState, type ReactNode } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWallet } from "@/generated/models/ApiWallet";
import { amIUser } from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import UserPageIdentityStatementsConsolidatedAddressesItem from "./UserPageIdentityStatementsConsolidatedAddressesItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

function getPrimaryAddress(profile: ApiIdentity): string | null {
  if (profile.primary_wallet) {
    return profile.primary_wallet.toLowerCase();
  }

  const wallets = profile.wallets ?? [];
  if (wallets.length === 0) {
    return null;
  }

  const [firstWallet, ...remainingWallets] = wallets;
  if (!firstWallet) {
    return null;
  }

  const highestTdhWallet = remainingWallets.reduce(
    (highest, wallet) => (wallet.tdh > highest.tdh ? wallet : highest),
    firstWallet
  );

  return highestTdhWallet.wallet.toLowerCase();
}

function sortByPrimary(
  wallets: ApiWallet[],
  primaryAddress: string | null
): ApiWallet[] {
  return [...wallets].sort((a, b) => {
    if (a.wallet.toLowerCase() === primaryAddress) {
      return -1;
    }

    if (b.wallet.toLowerCase() === primaryAddress) {
      return 1;
    }

    return b.tdh - a.tdh;
  });
}

export default function UserPageIdentityStatementsConsolidatedAddresses({
  profile,
  headerAction,
}: {
  readonly profile: ApiIdentity;
  readonly headerAction?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const canEdit = amIUser({ profile, address }) && !activeProfileProxy;
  const primaryAddress = getPrimaryAddress(profile);
  const sortedByPrimary = useMemo(
    () => sortByPrimary(profile.wallets ?? [], primaryAddress),
    [primaryAddress, profile.wallets]
  );

  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

  const walletConsolidations = useQueries({
    queries: (profile.wallets ?? []).map((wallet) => ({
      queryKey: [
        QueryKey.WALLET_CONSOLIDATIONS_CHECK,
        wallet.wallet.toLowerCase(),
      ],
      queryFn: () =>
        commonApiFetch<Page<WalletConsolidationState>>({
          endpoint: `consolidations/${wallet.wallet.toLowerCase()}`,
          params: {
            show_incomplete: "true",
          },
        }),
      enabled: !!address,
    })),
  });

  const showDelegationCenter =
    !!address &&
    walletConsolidations.some((walletConsolidation) =>
      walletConsolidation.data?.data.some(
        (c) =>
          c.wallet1.toLowerCase() === address.toLowerCase() ||
          c.wallet2.toLowerCase() === address.toLowerCase()
      )
    );

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            {t(
              locale,
              "user.profile.identity.statements.consolidatedAddresses"
            )}
          </span>
          <button
            type="button"
            aria-label={t(locale, "user.profile.identity.statements.help")}
            className="tw-inline-flex tw-h-11 tw-w-11 tw-appearance-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-white/5 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-h-8 lg:tw-w-8"
            data-tooltip-id="statements-help"
          >
            <svg
              className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {headerAction}
      </div>
      <ul className="tw-mb-0 tw-mt-1 tw-list-none tw-space-y-2 tw-pl-0">
        {sortedByPrimary.map((wallet) => (
          <UserPageIdentityStatementsConsolidatedAddressesItem
            key={wallet.wallet}
            address={wallet}
            primaryAddress={primaryAddress}
            canEdit={canEdit}
            isOpen={expandedWallet === wallet.wallet.toLowerCase()}
            onToggleOpen={() => {
              const normalizedWallet = wallet.wallet.toLowerCase();
              setExpandedWallet((current) =>
                current === normalizedWallet ? null : normalizedWallet
              );
            }}
          />
        ))}
      </ul>
      {(primaryAddress !== null || showDelegationCenter) && (
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-pt-4">
          {primaryAddress && (
            <ButtonLink
              href={`/delegation/wallet-checker?address=${primaryAddress}`}
              variant="secondary"
              size="xs"
            >
              {t(locale, "user.profile.identity.statements.walletChecker")}
            </ButtonLink>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {showDelegationCenter && (
              <ButtonLink
                href="/delegation/delegation-center"
                variant="secondary"
                size="xs"
              >
                {t(locale, "user.profile.identity.statements.delegationCenter")}
              </ButtonLink>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
