import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "@/components/distribution-plan-tool/review-distribution-plan/table/constants";
import {
  buildReviewDistributionPlanTableRows,
  ReviewDistributionPlanTableItemType,
} from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable.types";

const phases = [
  {
    id: "p1",
    name: "Phase 1",
    walletsCount: 1,
    components: [
      {
        id: "c1",
        name: "Comp1",
        description: "d1",
        winnersWalletsCount: 1,
        winnersSpotsCount: 2,
      },
      {
        id: "c2",
        name: "Comp2",
        description: "d2",
        winnersWalletsCount: 1,
        winnersSpotsCount: 3,
      },
    ],
  },
] as any;

describe("ReviewDistributionPlanTable", () => {
  it("converts phases to rows for table children", () => {
    const rows = buildReviewDistributionPlanTableRows({
      phases,
      connectedProfile: null,
      distributionAdminWallets: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.phase).toEqual(
      expect.objectContaining({
        id: phases[0].id,
        type: ReviewDistributionPlanTableItemType.PHASE,
        spotsCount: 5,
      })
    );
    expect(rows[0]!.components).toEqual([
      expect.objectContaining({
        id: "c1",
        type: ReviewDistributionPlanTableItemType.COMPONENT,
        spotsCount: 2,
      }),
      expect.objectContaining({
        id: "c2",
        type: ReviewDistributionPlanTableItemType.COMPONENT,
        spotsCount: 3,
      }),
    ]);
  });

  it("adds the public subscriptions row for distribution admins", () => {
    const rows = buildReviewDistributionPlanTableRows({
      phases,
      connectedProfile: {
        wallets: [{ wallet: "0x0000000000000000000000000000000000000001" }],
      } as any,
      distributionAdminWallets: [
        "0x0000000000000000000000000000000000000001",
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[1]!.phase).toEqual(
      expect.objectContaining({
        id: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
        type: ReviewDistributionPlanTableItemType.PHASE,
        name: "Public",
        spotsCount: 0,
      })
    );
  });
});
