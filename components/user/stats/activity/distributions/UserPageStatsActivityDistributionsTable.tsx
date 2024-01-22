import { useEffect, useState } from "react";
import { IDistribution } from "../../../../../entities/IDistribution";

export enum DistributionPhase {
  AIRDROP = "AIRDROP",
  ALLOWLIST = "ALLOWLIST",
  PHASE_0 = "PHASE_0",
  PHASE_1 = "PHASE_1",
  PHASE_2 = "PHASE_2",
  PHASE_3 = "PHASE_3",
}

export interface DistributionTableItem {
  readonly collection: string;
  readonly tokenId: string;
  readonly name: string;
  readonly wallet: string;
  readonly phase: DistributionPhase;
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
}: {
  readonly items: IDistribution[];
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

  useEffect(() => {
    setAvailablePhases(getAvailablePhases());
  }, [items]);





  return (
    // <div>
    //   {items.map((item) => (
    //     <div key={`${item.contract}-${item.card_id}-${item.wallet}`}>
    //       {item.card_id}
    //     </div>
    //   ))}
    // </div>
    <table className="tw-min-w-full">
      <thead className="tw-bg-iron-900">
        <tr>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Collection
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            ID
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Name
          </th>

          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Wallet
          </th>
          {availablePhases.map((phase) => (
            <th
              key={phase}
              scope="col"
              className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
            >
              {PHASE_TO_TEXT[phase]}
            </th>
          ))}
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Minted
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Total
          </th>
          <th
            scope="col"
            className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
          ></th>
        </tr>
      </thead>
      <tbody className="">
        {/* {data.data.flatMap((rows) =>
          rows.map((row) => (
            <UserPageStatsTableSection key={getRandomObjectId()} data={row} />
          ))
        )} */}
      </tbody>
    </table>
  );
}
