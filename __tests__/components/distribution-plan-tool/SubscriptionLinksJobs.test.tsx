import { fireEvent, render, screen } from "@testing-library/react";
import { SubscriptionLinks } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription";
import { useDropForgeProcess } from "@/hooks/useDropForgeProcess";
import { forgeList } from "@/services/api/drop-forge-api";
import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import {
  ReviewDistributionPlanTableItemType,
  type ReviewDistributionPlanTableItem,
} from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable.types";
jest.mock("@/hooks/useDropForgeProcess", () => ({
  useDropForgeProcess: jest.fn(),
}));
jest.mock("@/services/api/drop-forge-api", () => ({ forgeList: jest.fn() }));
jest.mock("@/components/auth/Auth", () => ({
  AuthContext: require("react").createContext({
    connectedProfile: null,
    setToast: jest.fn(),
  }),
}));
jest.mock(
  "@/components/distribution-plan-tool/DistributionPlanToolContext",
  () => ({
    DistributionPlanToolContext: require("react").createContext({
      confirmedTokenId: "123",
      phases: [
        { id: "p0", name: "Phase 0" },
        { id: "p1", name: "Phase 1" },
        { id: "p2", name: "Phase 2" },
      ],
    }),
  })
);
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: { distribution_admin_wallets: [] },
  }),
}));
jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription.utils",
  () => ({ isSubscriptionsAdmin: () => true })
);
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
const phase: ReviewDistributionPlanTableItem = {
  id: "p0",
  phaseId: "p0",
  name: "Phase 0",
  type: ReviewDistributionPlanTableItemType.PHASE,
  componentId: null,
  description: "",
  walletsCount: 1,
  spotsCount: 1,
};
it.each([undefined, ["old0", "old1", "old2"]])(
  "never downloads a completed job with missing or stale phase evidence",
  (phase_ids) => {
    jest.mocked(useDropForgeProcess).mockReturnValue({
      data: { id: "job", status: "COMPLETED", phase_ids },
    } as ReturnType<typeof useDropForgeProcess>);
    render(
      <SubscriptionLinks
        plan={{ id: "plan" } as AllowlistDescription}
        phase={phase}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(forgeList).not.toHaveBeenCalled();
  }
);
