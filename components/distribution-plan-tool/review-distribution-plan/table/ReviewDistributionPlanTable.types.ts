import type {
  AllowlistPhaseWithComponentAndItems,
  AllowlistResult,
} from "@/components/allowlist-tool/allowlist-tool.types";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import { isSubscriptionsAdmin } from "./ReviewDistributionPlanTableSubscription.utils";

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

export function buildReviewDistributionPlanTableRows({
  phases,
  connectedProfile,
  distributionAdminWallets = [],
}: {
  readonly phases: AllowlistPhaseWithComponentAndItems[];
  readonly connectedProfile: ApiIdentity | null;
  readonly distributionAdminWallets?: string[] | undefined;
}): ReviewDistributionPlanTablePhase[] {
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

  if (isSubscriptionsAdmin(connectedProfile, distributionAdminWallets)) {
    allRows.push({
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
    });
  }

  return allRows;
}
