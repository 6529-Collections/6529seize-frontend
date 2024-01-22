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
  readonly wallet: string;
  readonly contract: string;
  readonly tokenId: string;
  readonly phase: DistributionPhase;
  readonly amountMinted: number;
  readonly amountTotal: number;
  readonly tokenName: string;
  readonly date: string;
}

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
    <div>
      {items.map((item) => (
        <div key={`${item.contract}-${item.card_id}-${item.wallet}`}>
          {item.card_id}
        </div>
      ))}
    </div>
  );
}
