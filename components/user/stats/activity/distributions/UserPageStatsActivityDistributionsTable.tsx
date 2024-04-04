import { useEffect, useState } from "react";
import { Distribution } from "../../../../../entities/IDistribution";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import {
  areEqualAddresses,
  capitalizeEveryWord,
} from "../../../../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../../../../constants";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageStatsActivityDistributionsTableItem from "./UserPageStatsActivityDistributionsTableItem";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";

export enum DistributionCollection {
  MEMES = "MEMES",
  GRADIENTS = "GRADIENTS",
  MEMELAB = "MEMELAB",
}

export interface DistributionTableItem {
  readonly collection: DistributionCollection;
  readonly tokenId: number;
  readonly name: string;
  readonly wallet: string;
  readonly phases: number[];
  readonly amountMinted: number;
  readonly amountTotal: number;
  readonly date: string;
}

export default function UserPageStatsActivityDistributionsTable({
  items,
  profile,
  loading,
}: {
  readonly items: Distribution[];
  readonly profile: IProfileAndConsolidations;
  readonly loading: boolean;
}) {
  const getAvailablePhases = (): string[] => {
    const phases: Set<string> = new Set();
    for (const item of items) {
      for (const p of item.phases) {
        phases.add(p);
      }
    }
    return Array.from(phases);
  };

  const [availablePhases, setAvailablePhases] = useState<string[]>(
    getAvailablePhases()
  );

  const [results, setResults] = useState<DistributionTableItem[]>([]);

  const getCollectionEnum = (contract: string): DistributionCollection => {
    if (areEqualAddresses(contract, MEMES_CONTRACT)) {
      return DistributionCollection.MEMES;
    }
    if (areEqualAddresses(contract, GRADIENT_CONTRACT)) {
      return DistributionCollection.GRADIENTS;
    }

    if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
      return DistributionCollection.MEMELAB;
    }
    throw new Error(`Unknown contract ${contract}`);
  };

  const getItemPhaseAmount = ({
    phase,
    item,
  }: {
    readonly phase: string;
    readonly item: Distribution;
  }): number => {
    let count = 0;

    if (phase.toUpperCase() === "AIRDROP") {
      count = item.airdrops;
    } else {
      const p = item.allowlist.find((a) => a.phase === phase);
      count = p?.spots ?? 0;
    }

    return count ?? 0;
  };

  useEffect(() => {
    const phases = getAvailablePhases();
    setAvailablePhases(phases);
    setResults(
      items.map((item) => ({
        collection: getCollectionEnum(item.contract),
        tokenId: item.card_id,
        name: item.card_name,
        wallet:
          profile.consolidation.wallets.find(
            (w) => w.wallet.address.toLowerCase() === item.wallet.toLowerCase()
          )?.wallet.ens ??
          item.wallet_display ??
          item.wallet,
        phases: phases.map((phase) => getItemPhaseAmount({ phase, item })),
        amountMinted: item.minted,
        amountTotal: item.total_count,
        date: item.mint_date,
      }))
    );
  }, [items]);

  return (
    <table className="tw-min-w-full tw-divide-y tw-divide-iron-700">
      <thead className="tw-bg-iron-900">
        <tr>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
            Collection
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
            Token
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3  tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
            Name
          </th>

          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
            Wallet
          </th>
          {availablePhases.map((phase) => (
            <th
              key={getRandomObjectId()}
              scope="col"
              className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
              {capitalizeEveryWord(phase.replaceAll("_", " "))}
            </th>
          ))}
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
            Minted
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
            Total
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
            <div className={loading ? "tw-opacity-100" : "tw-opacity-0"}>
              <CircleLoader />
            </div>
          </th>
        </tr>
      </thead>
      <tbody className="tw-divide-y tw-divide-iron-800">
        {results.map((item) => (
          <UserPageStatsActivityDistributionsTableItem
            key={`${item.collection}-${item.tokenId}-${item.wallet}`}
            item={item}
          />
        ))}
      </tbody>
    </table>
  );
}
