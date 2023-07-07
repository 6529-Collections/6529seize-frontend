import { useContext, useEffect, useState } from "react";
import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";
import ReviewDistributionPlanTableBody from "./ReviewDistributionPlanTableBody";
import ReviewDistributionPlanTableHeader from "./ReviewDistributionPlanTableHeader";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { AllowlistResult } from "../../../allowlist-tool/allowlist-tool.types";
export enum ReviewDistributionPlanTableItemType {
  PHASE = "PHASE",
  COMPONENT = "COMPONENT",
}

export interface ReviewDistributionPlanTableItem {
  id: string;
  type: ReviewDistributionPlanTableItemType;
  phaseId: string;
  componentId: string | null;
  name: string;
  description: string;
  walletsCount: number;
  tokensCount: number;
}

export interface ReviewDistributionPlanTablePhase {
  phase: ReviewDistributionPlanTableItem;
  components: ReviewDistributionPlanTableItem[];
}

export interface FullResultWallet extends AllowlistResult {
  readonly phaseName: string;
  readonly componentName: string;
}
export default function ReviewDistributionPlanTable() {
  const { phases } = useContext(DistributionPlanToolContext);

  const [rows, setRows] = useState<ReviewDistributionPlanTablePhase[]>([]);

  useEffect(() => {
    setRows(
      phases.map((phase) => ({
        phase: {
          id: phase.id,
          phaseId: phase.id,
          componentId: null,
          type: ReviewDistributionPlanTableItemType.PHASE,
          name: phase.name,
          description: phase.description,
          walletsCount: phase.walletsCount,
          tokensCount: phase.tokensCount,
        },
        components: phase.components.map((component) => ({
          id: component.id,
          phaseId: phase.id,
          componentId: component.id,
          type: ReviewDistributionPlanTableItemType.COMPONENT,
          name: component.name,
          description: component.description,
          walletsCount: component.winnersWalletsCount,
          tokensCount: component.winnersSpotsCount,
        })),
      }))
    );
  }, [phases]);
  return (
    <DistributionPlanTableWrapper>
      <ReviewDistributionPlanTableHeader rows={rows} />
      <ReviewDistributionPlanTableBody rows={rows} />
    </DistributionPlanTableWrapper>
  );
}
