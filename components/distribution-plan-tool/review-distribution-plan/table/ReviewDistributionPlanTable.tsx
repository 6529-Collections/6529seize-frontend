"use client";

import { AllowlistResult } from "@/components/allowlist-tool/allowlist-tool.types";
import { AuthContext } from "@/components/auth/Auth";
import DistributionPlanTableWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableWrapper";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { useContext, useEffect, useState } from "react";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import ReviewDistributionPlanTableBody from "./ReviewDistributionPlanTableBody";
import ReviewDistributionPlanTableHeader from "./ReviewDistributionPlanTableHeader";
import { isSubscriptionsAdmin } from "./ReviewDistributionPlanTableSubscription";
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
  const { connectedProfile } = useContext(AuthContext);

  const [rows, setRows] = useState<ReviewDistributionPlanTablePhase[]>([]);

  useEffect(() => {
    const phaseRows = phases.map((phase) => {
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
    });

    const allRows: ReviewDistributionPlanTablePhase[] = [...phaseRows];

    if (isSubscriptionsAdmin(connectedProfile)) {
      const publicRow: ReviewDistributionPlanTablePhase = {
        phase: {
          id: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
          phaseId: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
          componentId: null,
          type: ReviewDistributionPlanTableItemType.PHASE,
          name: "Public",
          description: "Auto-generated",
          walletsCount: 0,
          spotsCount: 0,
        },
        components: [],
      };
      allRows.push(publicRow);
    }

    setRows(allRows);
  }, [phases, connectedProfile]);
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
