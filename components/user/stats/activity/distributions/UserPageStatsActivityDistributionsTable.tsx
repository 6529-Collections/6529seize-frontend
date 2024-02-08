import { useEffect, useState } from "react";
import { IDistribution } from "../../../../../entities/IDistribution";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { areEqualAddresses } from "../../../../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../../../../constants";
import {
  assertUnreachable,
  getRandomObjectId,
} from "../../../../../helpers/AllowlistToolHelpers";
import UserPageStatsActivityDistributionsTableItem from "./UserPageStatsActivityDistributionsTableItem";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";

export enum DistributionPhase {
  AIRDROP = "AIRDROP",
  ALLOWLIST = "ALLOWLIST",
  PHASE_0 = "PHASE_0",
  PHASE_1 = "PHASE_1",
  PHASE_2 = "PHASE_2",
  PHASE_3 = "PHASE_3",
}

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

const PHASE_TO_TEXT: { [key in DistributionPhase]: string } = {
  [DistributionPhase.AIRDROP]: "Airdrop",
  [DistributionPhase.ALLOWLIST]: "Allowlist",
  [DistributionPhase.PHASE_0]: "Phase 0",
  [DistributionPhase.PHASE_1]: "Phase 1",
  [DistributionPhase.PHASE_2]: "Phase 2",
  [DistributionPhase.PHASE_3]: "Phase 3",
};

export default function UserPageStatsActivityDistributionsTable({
  items,
  profile,
  loading,
}: {
  readonly items: IDistribution[];
  readonly profile: IProfileAndConsolidations;
  readonly loading: boolean;
}) {
  const getAvailablePhases = (): DistributionPhase[] => {
    const phases: Set<DistributionPhase> = new Set();
    for (const item of items) {
      if (item.airdrop > 0) {
        phases.add(DistributionPhase.AIRDROP);
      }
      if (item.allowlist > 0) {
        phases.add(DistributionPhase.ALLOWLIST);
      }
      if (item.phase_0 > 0) {
        phases.add(DistributionPhase.PHASE_0);
      }
      if (item.phase_1 > 0) {
        phases.add(DistributionPhase.PHASE_1);
      }
      if (item.phase_2 > 0) {
        phases.add(DistributionPhase.PHASE_2);
      }
      if (item.phase_3 > 0) {
        phases.add(DistributionPhase.PHASE_3);
      }
    }
    return Array.from(phases);
  };

  const [availablePhases, setAvailablePhases] = useState<DistributionPhase[]>(
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
    readonly phase: DistributionPhase;
    readonly item: IDistribution;
  }): number => {
    switch (phase) {
      case DistributionPhase.AIRDROP:
        return item.airdrop;
      case DistributionPhase.ALLOWLIST:
        return item.allowlist;
      case DistributionPhase.PHASE_0:
        return item.phase_0;
      case DistributionPhase.PHASE_1:
        return item.phase_1;
      case DistributionPhase.PHASE_2:
        return item.phase_2;
      case DistributionPhase.PHASE_3:
        return item.phase_3;
      default:
        assertUnreachable(phase);
        return 0;
    }
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
          item.display ??
          item.wallet,
        phases: phases.map((phase) => getItemPhaseAmount({ phase, item })),
        amountMinted: item.total_minted,
        amountTotal: item.total_minted + item.airdrop,
        date: item.card_mint_date,
      }))
    );
  }, [items]);

  return (
    <table className="tw-min-w-full tw-divide-y tw-divide-iron-700">
      <thead className="tw-bg-iron-900">
        <tr>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Collection
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Token
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3  tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Name
          </th>

          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Wallet
          </th>
          {availablePhases.map((phase) => (
            <th
              key={getRandomObjectId()}
              scope="col"
              className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
            >
              {PHASE_TO_TEXT[phase]}
            </th>
          ))}
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Minted
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Total
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
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
