import UserPageHeaderSubscriptionStatus from "@/components/user/user-page-header/UserPageHeaderSubscriptionStatus";
import { useSubscriptionCoverage } from "@/components/user/subscriptions/coverage/useSubscriptionCoverage";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/user/subscriptions/coverage/useSubscriptionCoverage");
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: false }),
}));

const useSubscriptionCoverageMock =
  useSubscriptionCoverage as jest.MockedFunction<
    typeof useSubscriptionCoverage
  >;

describe("UserPageHeaderSubscriptionStatus", () => {
  beforeEach(() => {
    useSubscriptionCoverageMock.mockReturnValue({
      data: {
        status: ApiSubscriptionCoverageStatus.RunningLow,
        mode: ApiSubscriptionCoverageMode.Automatic,
        balance_eth: "0.18",
        fully_funded_drops: 2,
        funded_through: {
          token_id: 560,
          mint_at: new Date("2026-10-12T15:40:00Z"),
        },
      },
      isLoading: false,
    } as ReturnType<typeof useSubscriptionCoverage>);
  });

  it("puts the owner runway and contextual action in the profile header", () => {
    render(
      <UserPageHeaderSubscriptionStatus
        profile={
          {
            consolidation_key: "profile-key",
            normalised_handle: "sesamenoodles",
          } as ApiIdentity
        }
      />
    );

    expect(
      screen.getByText("Automatic · 0.18 ETH · 2 drops funded")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Running low · through The Memes #560, Oct 12, 2026")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Top up" })).toHaveAttribute(
      "href",
      "/sesamenoodles/subscriptions#profile-subscriptions-top-up"
    );
  });

  it("keeps the early warning top-up action visually secondary", () => {
    useSubscriptionCoverageMock.mockReturnValue({
      data: {
        status: ApiSubscriptionCoverageStatus.EarlyWarning,
        mode: ApiSubscriptionCoverageMode.Automatic,
        balance_eth: "0.30",
        fully_funded_drops: 4,
        funded_through: null,
      },
      isLoading: false,
    } as ReturnType<typeof useSubscriptionCoverage>);

    render(
      <UserPageHeaderSubscriptionStatus
        profile={
          {
            consolidation_key: "profile-key",
            normalised_handle: "sesamenoodles",
          } as ApiIdentity
        }
      />
    );

    expect(screen.getByRole("link", { name: "Top up" })).toHaveClass(
      "tw-bg-white/10"
    );
  });
});
