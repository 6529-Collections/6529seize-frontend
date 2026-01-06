import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { AuthContext } from "@/components/auth/Auth";
import UserPageSubscriptionsUpcoming from "@/components/user/subscriptions/UserPageSubscriptionsUpcoming";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

const mockInvalidateQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const mockUpcomingRows = [
  {
    utcDay: new Date("2024-01-01T00:00:00Z"),
    instantUtc: new Date("2024-01-01T15:40:00Z"),
    meme: 201,
    seasonIndex: 1,
  },
  {
    utcDay: new Date("2024-01-02T00:00:00Z"),
    instantUtc: new Date("2024-01-02T15:40:00Z"),
    meme: 202,
    seasonIndex: 1,
  },
  {
    utcDay: new Date("2024-01-03T00:00:00Z"),
    instantUtc: new Date("2024-01-03T15:40:00Z"),
    meme: 203,
    seasonIndex: 1,
  },
  {
    utcDay: new Date("2024-01-04T00:00:00Z"),
    instantUtc: new Date("2024-01-04T15:40:00Z"),
    meme: 204,
    seasonIndex: 1,
  },
];

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  formatFullDate: jest.fn((date: Date) => {
    const iso = date.toISOString().split("T")[0];
    const day = date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    return `${iso} / ${day}`;
  }),
  getUpcomingMintsAcrossSeasons: jest.fn(() => mockUpcomingRows),
  isMintingToday: jest.fn(() => false),
  displayedSeasonNumberFromIndex: jest.fn((idx: number) => idx + 1),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const mockSubscriptions: NFTSubscription[] = [
  {
    token_id: 1,
    contract: "0x123",
    subscribed: true,
  } as NFTSubscription,
  {
    token_id: 2,
    contract: "0x123",
    subscribed: false,
  } as NFTSubscription,
  {
    token_id: 3,
    contract: "0x123",
    subscribed: true,
  } as NFTSubscription,
  {
    token_id: 4,
    contract: "0x123",
    subscribed: false,
  } as NFTSubscription,
];

const FIXED_TIMESTAMP = 1609459200000;

const mockDetails: SubscriptionDetails = {
  consolidation_key: "testuser",
  last_update: FIXED_TIMESTAMP,
  balance: 1,
  automatic: true,
  subscribe_all_editions: false,
  subscription_eligibility_count: 1,
};

describe("UserPageSubscriptionsUpcoming", () => {
  const useQueryMock = useQuery as jest.Mock;
  const mockRefresh = jest.fn();
  const mockRequestAuth = jest.fn();
  const mockSetToast = jest.fn();

  beforeEach(() => {
    useQueryMock.mockImplementation(({ enabled }) => ({
      data: enabled
        ? {
            phase: "Phase 1",
            phase_position: 100,
            phase_subscriptions: 500,
            airdrop_address: "0xabc123",
          }
        : null,
    }));
    mockRequestAuth.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props: Partial<any> = {}) => {
    const authContext = createMockAuthContext({
      requestAuth: mockRequestAuth,
      setToast: mockSetToast,
    });

    const defaultProps = {
      profileKey: "testuser",
      details: mockDetails,
      memes_subscriptions: mockSubscriptions,
      readonly: false,
      refresh: mockRefresh,
      ...props,
    };

    return render(
      <AuthContext.Provider value={authContext}>
        <UserPageSubscriptionsUpcoming {...defaultProps} />
      </AuthContext.Provider>
    );
  };

  it("renders upcoming drops title", () => {
    renderComponent();
    expect(screen.getByText("Upcoming Drops")).toBeInTheDocument();
  });

  it("displays first 3 subscriptions by default", () => {
    renderComponent();
    expect(screen.getByText("The Memes #1")).toBeInTheDocument();
    expect(screen.getByText("The Memes #2")).toBeInTheDocument();
    expect(screen.getByText("The Memes #3")).toBeInTheDocument();
    expect(screen.queryByText("The Memes #4")).not.toBeInTheDocument();
  });

  it("shows expand button when there are more than 3 subscriptions", () => {
    renderComponent();
    expect(screen.getByText("Show More")).toBeInTheDocument();
  });

  it("expands to show all subscriptions when Show More clicked", () => {
    renderComponent();

    fireEvent.click(screen.getByText("Show More"));

    expect(screen.getByText("The Memes #4")).toBeInTheDocument();
    expect(screen.getByText("Show Less")).toBeInTheDocument();
  });

  it("collapses back to 3 subscriptions when Show Less clicked", () => {
    renderComponent();

    fireEvent.click(screen.getByText("Show More"));
    fireEvent.click(screen.getByText("Show Less"));

    expect(screen.queryByText("The Memes #4")).not.toBeInTheDocument();
    expect(screen.getByText("Show More")).toBeInTheDocument();
  });

  it("displays subscription toggles in correct state", () => {
    renderComponent();

    const toggles = screen.getAllByRole("button");
    expect(toggles.length).toBeGreaterThan(0);
  });

  it("shows phase information for first subscription", () => {
    renderComponent();

    expect(screen.getByText(/Phase: Phase 1/)).toBeInTheDocument();
    expect(screen.getByText(/Subscription Position: 100/)).toBeInTheDocument();
    expect(screen.getByText(/Airdrop Address: 0xabc123/)).toBeInTheDocument();
  });

  it("does not show phase information when not available", () => {
    useQueryMock.mockReturnValue({
      data: null,
    });

    renderComponent();

    expect(screen.queryByText(/Phase:/)).not.toBeInTheDocument();
  });

  it("displays dates for subscriptions", () => {
    renderComponent();

    expect(screen.getByText("2024-01-01 / Monday")).toBeInTheDocument();
    expect(screen.getByText("2024-01-02 / Tuesday")).toBeInTheDocument();
  });

  it("shows minting today message when applicable", () => {
    const {
      isMintingToday,
    } = require("@/components/meme-calendar/meme-calendar.helpers");
    isMintingToday.mockReturnValue(true);

    renderComponent();

    expect(screen.getByText(/Minting Today/)).toBeInTheDocument();
  });

  it("disables toggles in readonly mode", () => {
    renderComponent({ readonly: true });

    const toggles = screen.getAllByRole("button");
    const subscriptionToggles = toggles.filter((toggle) =>
      toggle.getAttribute("aria-label")?.includes("Toggle subscription")
    );

    subscriptionToggles.forEach((toggle) => {
      expect(toggle).toBeDisabled();
    });
  });

  it("handles empty subscriptions list", () => {
    renderComponent({ memes_subscriptions: [] });

    expect(screen.getByText("Upcoming Drops")).toBeInTheDocument();
    expect(screen.queryByText("Show More")).not.toBeInTheDocument();
  });

  it("does not show expand button when no subscriptions", () => {
    renderComponent({ memes_subscriptions: [] });

    expect(screen.queryByText("Show More")).not.toBeInTheDocument();
  });

  it("calls query for final subscription data only for first subscription", () => {
    renderComponent();

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["consolidation-final-subscription", "testuser-0x123-1"],
        enabled: true,
      })
    );
  });
});
