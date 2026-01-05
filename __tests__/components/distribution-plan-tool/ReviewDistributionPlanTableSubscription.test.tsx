const mockFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: any[]) => mockFetch(...args),
  commonApiPost: jest.fn(),
}));

import * as ReviewDistributionPlanTableSubscriptionModule from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
const { download, isSubscriptionsAdmin } =
  ReviewDistributionPlanTableSubscriptionModule;

describe("ReviewDistributionPlanTableSubscription utilities", () => {
  it("checks subscriptions admin wallets", () => {
    const profile: Partial<ApiIdentity> = { wallets: [{ wallet: "0xabc" }] };
    expect(isSubscriptionsAdmin(profile as ApiIdentity)).toBe(false);
  });

  it("downloads subscription results", async () => {
    mockFetch.mockResolvedValue({
      airdrops: [],
      airdrops_unconsolidated: [],
      allowlists: [],
    });
    await download("c", "1", "plan", "phase", "public");
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "subscriptions/allowlists/c/1/plan/phase",
    });
  });
  it("returns true when wallet is admin", () => {
    const profile: Partial<ApiIdentity> = {
      wallets: [{ wallet: "0x0187C9a182736ba18b44eE8134eE438374cf87DC" }],
    };
    expect(isSubscriptionsAdmin(profile as ApiIdentity)).toBe(true);
  });

  it("handles download failure", async () => {
    mockFetch.mockRejectedValue("fail");
    const result = await download("c", "1", "plan", "phase", "public");
    expect(result.success).toBe(false);
  });
});

import { AuthContext } from "@/components/auth/Auth";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { ReviewDistributionPlanTableItemType } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "@/components/distribution-plan-tool/review-distribution-plan/table/constants";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const { SubscriptionLinks } = ReviewDistributionPlanTableSubscriptionModule;

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="circle-loader">Loading...</div>,
}));

describe("SubscriptionLinks", () => {
  const mockSetToast = jest.fn();
  const mockAuthCtx = {
    connectedProfile: {
      wallets: [{ wallet: "0x0187C9a182736ba18b44eE8134eE438374cf87DC" }],
    },
    setToast: mockSetToast,
  };

  const mockPlan = { id: "plan1", name: "Meme 123 drop" } as any;
  const mockDistCtxWithTokenId = {
    confirmedTokenId: "123",
  } as any;

  const mockDistCtxNoTokenId = {
    confirmedTokenId: null,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      airdrops: [],
      airdrops_unconsolidated: [],
      allowlists: [],
    });
    const mockURL = {
      createObjectURL: jest.fn(() => "blob:mock-url"),
      revokeObjectURL: jest.fn(),
    };
    globalThis.URL = mockURL as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders Public Subscriptions button for public phase when token is confirmed", () => {
    const publicPhase = {
      id: "phase1",
      name: "public",
      type: ReviewDistributionPlanTableItemType.PHASE,
      phaseId: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
    } as any;

    render(
      <DistributionPlanToolContext.Provider value={mockDistCtxWithTokenId}>
        <AuthContext.Provider value={mockAuthCtx as any}>
          <SubscriptionLinks plan={mockPlan} phase={publicPhase} />
        </AuthContext.Provider>
      </DistributionPlanToolContext.Provider>
    );

    expect(screen.getByText("Public Subscriptions")).toBeInTheDocument();
  });

  it("does not render when token is not confirmed", () => {
    const publicPhase = {
      id: "phase1",
      name: "public",
      type: ReviewDistributionPlanTableItemType.PHASE,
      phaseId: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
    } as any;

    const { container } = render(
      <DistributionPlanToolContext.Provider value={mockDistCtxNoTokenId}>
        <AuthContext.Provider value={mockAuthCtx as any}>
          <SubscriptionLinks plan={mockPlan} phase={publicPhase} />
        </AuthContext.Provider>
      </DistributionPlanToolContext.Provider>
    );

    expect(container.innerHTML).toBe("");
  });

  it("calls download directly when button is clicked", async () => {
    const user = userEvent.setup();

    jest
      .spyOn(
        ReviewDistributionPlanTableSubscriptionModule,
        "isSubscriptionsAdmin"
      )
      .mockReturnValue(true);
    jest
      .spyOn(ReviewDistributionPlanTableSubscriptionModule, "download")
      .mockResolvedValue({
        success: true,
        message: "Download successful",
      });

    const publicPhase = {
      id: "phase1",
      name: "public",
      type: ReviewDistributionPlanTableItemType.PHASE,
      phaseId: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
    } as any;

    render(
      <DistributionPlanToolContext.Provider value={mockDistCtxWithTokenId}>
        <AuthContext.Provider value={mockAuthCtx as any}>
          <SubscriptionLinks plan={mockPlan} phase={publicPhase} />
        </AuthContext.Provider>
      </DistributionPlanToolContext.Provider>
    );

    await user.click(screen.getByText("Public Subscriptions"));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        type: "success",
        message: "Download successful",
      });
    });
  });

  it("does not render for non-admin users", () => {
    const nonAdminCtx = {
      connectedProfile: {
        wallets: [{ wallet: "0x123" }],
      },
      setToast: jest.fn(),
    };

    const publicPhase = {
      id: "phase1",
      name: "public",
      type: ReviewDistributionPlanTableItemType.PHASE,
      phaseId: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
    } as any;

    const { container } = render(
      <DistributionPlanToolContext.Provider value={mockDistCtxWithTokenId}>
        <AuthContext.Provider value={nonAdminCtx as any}>
          <SubscriptionLinks plan={mockPlan} phase={publicPhase} />
        </AuthContext.Provider>
      </DistributionPlanToolContext.Provider>
    );

    expect(container.innerHTML).toBe("");
  });

  it("shows loading state during download", async () => {
    const user = userEvent.setup();

    jest
      .spyOn(
        ReviewDistributionPlanTableSubscriptionModule,
        "isSubscriptionsAdmin"
      )
      .mockReturnValue(true);

    let resolveDownload: (value: { success: boolean; message: string }) => void;
    const downloadPromise = new Promise<{ success: boolean; message: string }>(
      (resolve) => {
        resolveDownload = resolve;
      }
    );

    jest
      .spyOn(ReviewDistributionPlanTableSubscriptionModule, "download")
      .mockReturnValue(downloadPromise);

    const publicPhase = {
      id: "phase1",
      name: "public",
      type: ReviewDistributionPlanTableItemType.PHASE,
      phaseId: PUBLIC_SUBSCRIPTIONS_PHASE_ID,
    } as any;

    render(
      <DistributionPlanToolContext.Provider value={mockDistCtxWithTokenId}>
        <AuthContext.Provider value={mockAuthCtx as any}>
          <SubscriptionLinks plan={mockPlan} phase={publicPhase} />
        </AuthContext.Provider>
      </DistributionPlanToolContext.Provider>
    );

    await user.click(screen.getByText("Public Subscriptions"));

    await waitFor(() => {
      expect(screen.getByText("Downloading")).toBeInTheDocument();
    });

    resolveDownload!({ success: true, message: "Done" });

    await waitFor(() => {
      expect(screen.getByText("Public Subscriptions")).toBeInTheDocument();
    });
  });
});
