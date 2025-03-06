import { useContext, useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  IProfileConsolidation,
  WalletConsolidationState,
} from "../../../../../entities/IProfile";
import EthereumIcon from "../../../utils/icons/EthereumIcon";
import UserPageIdentityStatementsConsolidatedAddressesItem from "./UserPageIdentityStatementsConsolidatedAddressesItem";
import { amIUser } from "../../../../../helpers/Helpers";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { useQueries } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { Page } from "../../../../../helpers/Types";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { AuthContext } from "../../../../auth/Auth";
import { useSeizeConnectContext } from "../../../../auth/SeizeConnectContext";

export default function UserPageIdentityStatementsConsolidatedAddresses({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
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

  const getPrimaryAddress = (p: IProfileAndConsolidations) => {
    if (p.profile?.primary_wallet) {
      return p.profile.primary_wallet.toLowerCase();
    }

    const highestTdhWallet = p.consolidation.wallets.reduce(
      (highest, wallet) => {
        if (wallet.tdh > highest.tdh) {
          return wallet;
        }

        return highest;
      }
    );

    return highestTdhWallet.wallet.address.toLowerCase();
  };

  const [primaryAddress, setPrimaryAddress] = useState<string>(
    getPrimaryAddress(profile)
  );

  useEffect(() => {
    setPrimaryAddress(getPrimaryAddress(profile));
  }, [profile]);

  const sortByPrimary = (wallets: IProfileConsolidation[]) => {
    const sorted = [...wallets];
    sorted.sort((a, b) => {
      if (a.wallet.address.toLowerCase() === primaryAddress) {
        return -1;
      }

      if (b.wallet.address.toLowerCase() === primaryAddress) {
        return 1;
      }

      return b.tdh - a.tdh;
    });

    return sorted;
  };

  const [sortedByPrimary, setSortedByPrimary] = useState<
    IProfileConsolidation[]
  >(sortByPrimary(profile.consolidation.wallets));

  useEffect(() => {
    setSortedByPrimary(sortByPrimary(profile.consolidation.wallets));
  }, [profile, primaryAddress]);

  const walletConsolidations = useQueries({
    queries: profile.consolidation.wallets.map((wallet) => ({
      queryKey: [
        QueryKey.WALLET_CONSOLIDATIONS_CHECK,
        wallet.wallet.address.toLowerCase(),
      ],
      queryFn: () =>
        commonApiFetch<Page<WalletConsolidationState>>({
          endpoint: `consolidations/${wallet.wallet.address.toLowerCase()}`,
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
      <div className="tw-flex tw-items-center tw-space-x-4">
        <div className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-700">
          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
            <EthereumIcon />
          </div>
        </div>
        <span className="tw-text-base tw-font-semibold tw-text-iron-50">
          Consolidated Addresses
        </span>
      </div>
      <ul className="tw-mb-0 tw-mt-4 md:tw-mt-6 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
        {sortedByPrimary.map((wallet) => (
          <UserPageIdentityStatementsConsolidatedAddressesItem
            key={wallet.wallet.address}
            address={wallet}
            profile={profile}
            primaryAddress={primaryAddress}
            canEdit={canEdit}
          />
        ))}
      </ul>
      <div className="tw-space-x-3 tw-pt-5 xl:tw-pt-4">
        <Link
          href={`/delegation/wallet-checker?address=${primaryAddress}`}
          className="tw-no-underline tw-relative tw-text-xs tw-font-medium tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-2.5 tw-py-2 tw-text-iron-200 hover:tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out">
          Wallet Checker
        </Link>
        <AnimatePresence mode="wait" initial={false}>
          {showDelegationCenter && (
            <Link
              href="/delegation/delegation-center"
              className="tw-no-underline tw-relative tw-text-xs tw-font-medium tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-2.5 tw-py-2 tw-text-iron-200 hover:tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out">
              Delegation Center
            </Link>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
