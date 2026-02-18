"use client";

import { useContext, useEffect, useState } from "react";
import type { WalletConsolidationState } from "@/entities/IProfile";

import UserPageIdentityStatementsConsolidatedAddressesItem from "./UserPageIdentityStatementsConsolidatedAddressesItem";
import { amIUser } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useQueries } from "@tanstack/react-query";
import type { Page } from "@/helpers/Types";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWallet } from "@/generated/models/ApiWallet";
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
      <span className="tw-text-[10px] tw-font-semibold tw-text-iron-600 tw-uppercase tw-tracking-widest">
        Consolidated Addresses
      </span>
      <div className="tw-mt-2 tw-h-px tw-bg-white/[0.04] tw-w-full"></div>
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
