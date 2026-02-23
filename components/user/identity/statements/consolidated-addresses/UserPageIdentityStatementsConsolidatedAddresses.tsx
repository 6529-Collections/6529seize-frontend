"use client";

import type { WalletConsolidationState } from "@/entities/IProfile";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWallet } from "@/generated/models/ApiWallet";
import { amIUser } from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import UserPageIdentityStatementsConsolidatedAddressesItem from "./UserPageIdentityStatementsConsolidatedAddressesItem";
export default function UserPageIdentityStatementsConsolidatedAddresses({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  const getCanEdit = (): boolean => isMyProfile && !activeProfileProxy;
  const [canEdit, setCanEdit] = useState<boolean>(getCanEdit());
  useEffect(() => setCanEdit(getCanEdit()), [isMyProfile, activeProfileProxy]);

  const getPrimaryAddress = (p: ApiIdentity) => {
    if (p.primary_wallet) {
      return p.primary_wallet.toLowerCase();
    }

    const highestTdhWallet = p.wallets?.reduce((highest, wallet) => {
      if (wallet.tdh > highest.tdh) {
        return wallet;
      }

      return highest;
    });

    return highestTdhWallet?.wallet.toLowerCase() ?? null;
  };

  const [primaryAddress, setPrimaryAddress] = useState<string | null>(
    getPrimaryAddress(profile)
  );

  useEffect(() => {
    setPrimaryAddress(getPrimaryAddress(profile));
  }, [profile]);

  const sortByPrimary = (wallets: ApiWallet[]) => {
    const sorted = [...wallets];
    sorted.sort((a, b) => {
      if (a.wallet.toLowerCase() === primaryAddress) {
        return -1;
      }

      if (b.wallet.toLowerCase() === primaryAddress) {
        return 1;
      }

      return b.tdh - a.tdh;
    });

    return sorted;
  };

  const [sortedByPrimary, setSortedByPrimary] = useState<ApiWallet[]>(
    sortByPrimary(profile.wallets ?? [])
  );

  useEffect(() => {
    setSortedByPrimary(sortByPrimary(profile.wallets ?? []));
  }, [profile, primaryAddress]);

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

  const [showDelegationCenter, setShowDelegationCenter] = useState(false);

  useEffect(() => {
    if (walletConsolidations.length === 0 || !address) {
      setShowDelegationCenter(false);
      return;
    }

    const haveAffectedWallets = walletConsolidations.some((w) =>
      w.data?.data.some(
        (c) =>
          c.wallet1.toLowerCase() === address?.toLowerCase() ||
          c.wallet2.toLowerCase() === address?.toLowerCase()
      )
    );
    setShowDelegationCenter(haveAffectedWallets);
  }, [walletConsolidations, address]);

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          Consolidated Addresses
        </span>
        <button
          type="button"
          aria-label="Statements help"
          className="tw-rounded-full tw-h-8 tw-w-8 tw-inline-flex tw-items-center tw-justify-center focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-400"
          data-tooltip-id="statements-help">
          <svg
            className="tw-flex-shrink-0 tw-w-4 tw-h-4 tw-text-iron-400"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
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
      <ul className="tw-mb-0 tw-mt-4 tw-list-none tw-space-y-3 tw-pl-0">
        {sortedByPrimary.map((wallet) => (
          <UserPageIdentityStatementsConsolidatedAddressesItem
            key={wallet.wallet}
            address={wallet}
            primaryAddress={primaryAddress}
            canEdit={canEdit}
          />
        ))}
      </ul>
      <div className="tw-space-x-3 tw-pt-5 xl:tw-pt-4">
        <Link
          href={`/delegation/wallet-checker?address=${primaryAddress}`}
          className="tw-no-underline tw-relative tw-text-xs tw-font-medium tw-inline-flex tw-items-center tw-rounded-lg tw-bg-white/[0.04] tw-px-2.5 tw-py-2 tw-text-iron-200 hover:tw-text-iron-200 focus:tw-outline-none tw-border tw-border-solid tw-border-white/10 tw-ring-0 hover:tw-bg-white/[0.08] focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out">
          Wallet Checker
        </Link>
        <AnimatePresence mode="wait" initial={false}>
          {showDelegationCenter && (
            <Link
              href="/delegation/delegation-center"
              className="tw-no-underline tw-relative tw-text-xs tw-font-medium tw-inline-flex tw-items-center tw-rounded-lg tw-bg-white/[0.04] tw-px-2.5 tw-py-2 tw-text-iron-200 hover:tw-text-iron-200 focus:tw-outline-none tw-border tw-border-solid tw-border-white/10 tw-ring-0 hover:tw-bg-white/[0.08] focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out">
              Delegation Center
            </Link>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
