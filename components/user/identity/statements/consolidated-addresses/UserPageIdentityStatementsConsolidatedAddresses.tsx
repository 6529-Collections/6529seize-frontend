import { useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  IProfileConsolidation,
} from "../../../../../entities/IProfile";
import EthereumIcon from "../../../utils/icons/EthereumIcon";
import UserPageIdentityStatementsConsolidatedAddressesItem from "./UserPageIdentityStatementsConsolidatedAddressesItem";

export default function UserPageIdentityStatementsConsolidatedAddresses({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const getPrimaryAddress = () => {
    if (profile.profile?.primary_wallet) {
      return profile.profile.primary_wallet.toLowerCase();
    }

    const highestTdhWallet = profile.consolidation.wallets.reduce(
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
    getPrimaryAddress()
  );

  useEffect(() => {
    setPrimaryAddress(getPrimaryAddress());
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

  return (
    <div>
      <div className="tw-flex tw-items-center tw-space-x-4">
        <div className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700">
          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
            <EthereumIcon />
          </div>
        </div>
        <span className="tw-text-base tw-font-semibold tw-text-iron-50">
          Consolidated Addresses
        </span>
      </div>
      <ul className="tw-mt-6 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
        {sortedByPrimary.map((wallet) => (
          <UserPageIdentityStatementsConsolidatedAddressesItem
            key={wallet.wallet.address}
            address={wallet}
            primaryAddress={primaryAddress}
          />
        ))}
      </ul>
    </div>
  );
}
