import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SubscriptionLinks } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription";
import { useDropForgeProcess } from "@/hooks/useDropForgeProcess";
import { commonApiFetch } from "@/services/api/common-api";
import { useDropForgeSettings } from "@/hooks/useDropForgeSettings";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "@/components/distribution-plan-tool/review-distribution-plan/table/constants";
import { forgeList } from "@/services/api/drop-forge-api";
import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import {
  ReviewDistributionPlanTableItemType,
  type ReviewDistributionPlanTableItem,
} from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable.types";
jest.mock("@/hooks/useDropForgeSettings", () => ({
  useDropForgeSettings: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
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
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useDropForgeSettings).mockReturnValue({
    data: { preparation_enabled: true },
  } as ReturnType<typeof useDropForgeSettings>);
});

it.each([
  [false, "Subscription Lists", "p0", 3],
  [true, "Public Subscriptions", "public", 1],
])(
  "uses the legacy CSV download when EMMA preparation is off (public: %s)",
  async (isPublic, label, phaseId, expectedFiles) => {
    jest.mocked(useDropForgeSettings).mockReturnValue({
      data: { preparation_enabled: false },
    } as ReturnType<typeof useDropForgeSettings>);
    jest.mocked(commonApiFetch).mockResolvedValue({
      airdrops: [],
      ...(isPublic ? {} : { airdrops_unconsolidated: [], allowlists: [] }),
    });
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: jest.fn().mockReturnValue("blob:test"),
      },
      revokeObjectURL: { configurable: true, value: jest.fn() },
    });
    try {
      render(
        <SubscriptionLinks
          plan={{ id: "plan" } as AllowlistDescription}
          phase={
            isPublic
              ? { ...phase, phaseId: PUBLIC_SUBSCRIPTIONS_PHASE_ID }
              : phase
          }
        />
      );
      fireEvent.click(screen.getByRole("button", { name: label }));
      await waitFor(() => expect(click).toHaveBeenCalledTimes(expectedFiles));
      expect(commonApiFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringMatching(new RegExp(`/123/plan/${phaseId}$`)),
        })
      );
      expect(useDropForgeProcess).not.toHaveBeenCalled();
    } finally {
      click.mockRestore();
    }
  }
);

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
