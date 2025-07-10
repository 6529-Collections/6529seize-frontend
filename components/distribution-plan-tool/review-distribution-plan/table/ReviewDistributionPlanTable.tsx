"use client";

import { useContext, useEffect, useState } from "react";
import DistributionPlanTableWrapper from "../../common/DistributionPlanTableWrapper";
import ReviewDistributionPlanTableBody from "./ReviewDistributionPlanTableBody";
import ReviewDistributionPlanTableHeader from "./ReviewDistributionPlanTableHeader";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { AllowlistResult } from "../../../allowlist-tool/allowlist-tool.types";
import { ReviewDistributionPlanTableSubscriptionFooter } from "./ReviewDistributionPlanTableSubscriptionFooter";
export enum ReviewDistributionPlanTableItemType {
  PHASE = "PHASE",
  COMPONENT = "COMPONENT",
}

export enum FetchResultsType {
  JSON = "JSON",
  CSV = "CSV",
  MANIFOLD = "MANIFOLD",
}

export interface ReviewDistributionPlanTableItem {
  id: string;
  type: ReviewDistributionPlanTableItemType;
  phaseId: string;
  componentId: string | null;
  name: string;
  description: string;
  walletsCount: number;
  spotsCount: number;
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
      phases.map((phase) => {
        const { components, spotsCount } = phase.components.reduce<{
          components: ReviewDistributionPlanTableItem[];
          spotsCount: number;
        }>(
          (acc, component) => {
            acc.components.push({
              id: component.id,
              phaseId: phase.id,
              componentId: component.id,
              type: ReviewDistributionPlanTableItemType.COMPONENT,
              name: component.name,
              description: component.description,
              walletsCount: component.winnersWalletsCount,
              spotsCount: component.winnersSpotsCount,
            });
            acc.spotsCount += component.winnersSpotsCount;
            return acc;
          },
          { components: [], spotsCount: 0 }
        );

        return {
          phase: {
            id: phase.id,
            phaseId: phase.id,
            componentId: null,
            type: ReviewDistributionPlanTableItemType.PHASE,
            name: phase.name,
            description: "",
            walletsCount: phase.walletsCount,
            spotsCount,
          },
          components,
        };
      })
    );
  }, [phases]);
  return (
    <>
      <DistributionPlanTableWrapper>
        <ReviewDistributionPlanTableHeader rows={rows} />
        <ReviewDistributionPlanTableBody rows={rows} />
      </DistributionPlanTableWrapper>
      <ReviewDistributionPlanTableSubscriptionFooter />
    </>
  );
}
