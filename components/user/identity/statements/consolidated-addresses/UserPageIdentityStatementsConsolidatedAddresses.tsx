"use client";

import { getSafeCollectingSectionPath } from "@/components/delegation/safe-collecting-routes";

import type { WalletConsolidationState } from "@/entities/IProfile";
import { useContext, useMemo, useState } from "react";
import clsx from "clsx";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWallet } from "@/generated/models/ApiWallet";
import { amIUser, createPossessionStr } from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import UserPageIdentityStatementsConsolidatedAddressesItem from "./UserPageIdentityStatementsConsolidatedAddressesItem";
import { useConsolidationPolicy } from "@/hooks/useConsolidationPolicy";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { DelegationCenterSection } from "@/types/enums";

const WALLET_ACTION_CLASSES =
  "tw-min-h-10 tw-min-w-0 !tw-whitespace-normal tw-px-2.5 tw-py-2 tw-text-xs";

/** Returns the primary wallet, falling back to the highest-TDH wallet. */
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

/** Orders wallets with the primary first, followed by descending TDH. */
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

/**
 * Lists profile wallets and exposes consolidation registration to the connected
 * owner outside proxy mode, provided the profile has a wallet to consolidate.
 */
export default function UserPageIdentityStatementsConsolidatedAddresses({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const locale = useBrowserLocale();
  const { limits } = useConsolidationPolicy();
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const canEdit = amIUser({ profile, address }) && !activeProfileProxy;
  const primaryAddress = getPrimaryAddress(profile);
  const walletCount = profile.wallets?.length ?? 0;
  const atWalletLimit = !!limits && walletCount >= limits.maxWallets;
  const canAddWallet = canEdit && primaryAddress !== null;
  const showAddWallet = canAddWallet && !!limits && !atWalletLimit;
  const walletLimit = limits ? formatInteger(locale, limits.maxWallets) : "";
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
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, "user.profile.identity.statements.addressesHeading", {
            name: createPossessionStr(profile.handle ?? null),
          })}
        </h3>
        {walletCount > 0 && (
          <span className="tw-ml-auto tw-shrink-0 tw-whitespace-nowrap tw-text-right tw-text-xs tw-text-iron-400">
            {limits
              ? t(locale, "user.profile.identity.statements.walletCount", {
                  count: formatInteger(locale, walletCount),
                  limit: walletLimit,
                })
              : formatInteger(locale, walletCount)}
          </span>
        )}
      </div>
      <ul className="tw-mb-0 tw-mt-3 tw-list-none tw-space-y-2 tw-pl-0">
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
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-pt-4">
          {primaryAddress && (
            <ButtonLink
              href={`/safe-collecting/wallet-checker?address=${primaryAddress}`}
              variant="secondary"
              size={null}
              fullWidth
              className={clsx(
                WALLET_ACTION_CLASSES,
                !showAddWallet && "tw-col-span-2"
              )}
            >
              {t(locale, "user.profile.identity.statements.walletChecker")}
            </ButtonLink>
          )}
          {showAddWallet && (
            <ButtonLink
              href={getSafeCollectingSectionPath(
                DelegationCenterSection.BUILD_CONSOLIDATION
              )}
              variant="primary"
              size={null}
              fullWidth
              className={WALLET_ACTION_CLASSES}
            >
              {t(locale, "user.profile.identity.statements.addWallet")}
            </ButtonLink>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {showDelegationCenter && (
              <ButtonLink
                href="/safe-collecting"
                variant="secondary"
                size={null}
                fullWidth
                className={clsx(WALLET_ACTION_CLASSES, "tw-col-span-2")}
              >
                {t(locale, "user.profile.identity.statements.delegationCenter")}
              </ButtonLink>
            )}
          </AnimatePresence>
        </div>
      )}
      {showAddWallet && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(locale, "user.profile.identity.statements.addWalletDescription")}
        </p>
      )}
      {canAddWallet && atWalletLimit && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(locale, "user.profile.identity.statements.walletLimitReached", {
            limit: walletLimit,
          })}
        </p>
      )}
    </div>
  );
}
