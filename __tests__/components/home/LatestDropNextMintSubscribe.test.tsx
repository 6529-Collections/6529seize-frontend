import { renderWithAuth } from "@/__tests__/utils/testContexts";
import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import { isMintingToday } from "@/components/meme-calendar/meme-calendar.helpers";
import { useQuery } from "@tanstack/react-query";
import { fireEvent, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  const { mockNextLinkComponent } = jest.requireActual(
    "@/__tests__/utils/nextLinkMock"
  );

  return {
    __esModule: true,
    default: mockNextLinkComponent,
  };
});

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: Parameters<typeof mockRouterPush>) =>
      mockRouterPush(...args),
  }),
}));

const mockSeizeConnectFresh = jest.fn();
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    seizeConnectFresh: mockSeizeConnectFresh,
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
}));

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  getCanonicalNextMintNumber: jest.fn(() => 478),
  getUpcomingMintsAcrossSeasons: jest.fn(() => [
    {
      utcDay: new Date("2026-04-03T00:00:00Z"),
      instantUtc: new Date("2026-04-03T15:40:00Z"),
      meme: 478,
      seasonIndex: 15,
    },
  ]),
  isMintingToday: jest.fn(() => false),
}));

const useQueryMock = useQuery as jest.Mock;
const isMintingTodayMock = isMintingToday as jest.Mock;

function expectReadonlySubscriptionToggle(
  container: HTMLElement,
  tooltipLabel: string,
  checked: boolean
) {
  const trigger = screen.getByRole("switch", { name: tooltipLabel });
  expect(trigger).toBeInTheDocument();
  expect(container).toContainElement(trigger);
  expect(trigger).toHaveAttribute("aria-checked", String(checked));
  expect(trigger).toHaveAttribute("aria-disabled", "true");
  expect(trigger).toHaveAttribute("tabindex", "0");
  expect(trigger).toHaveAttribute("data-tooltip-content", tooltipLabel);

  const toggle = trigger?.querySelector("[aria-hidden='true']");
  expect(toggle).toBeInTheDocument();
  expect(toggle).toHaveClass(checked ? "tw-bg-primary-500" : "tw-bg-black/35");
}

describe("LatestDropNextMintSubscribe", () => {
  beforeEach(() => {
    isMintingTodayMock.mockReturnValue(false);
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (
        queryKey[0] === "mint-subscription-status" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: {
            subscribed: true,
            eligibility: 3,
            count: 2,
          },
        };
      }

      if (
        queryKey[0] === "mint-subscription-status" &&
        queryKey[1] === "final"
      ) {
        return {
          data: undefined,
        };
      }

      if (
        queryKey[0] === "mint-subscription-counts" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: [{ token_id: 478, count: 12 }],
        };
      }

      if (
        queryKey[0] === "mint-subscription-counts" &&
        queryKey[1] === "redeemed"
      ) {
        return {
          data: {
            data: [{ token_id: 516, count: 9 }],
          },
        };
      }

      return {
        data: null,
        refetch: jest.fn(),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the subscribe section for the connected profile", () => {
    const { container } = renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(screen.getByText("Subscription Minting")).toBeInTheDocument();
    expect(screen.getByText("x12 subscribers")).toBeInTheDocument();
    expect(screen.getByText("x2")).toBeInTheDocument();
    expectReadonlySubscriptionToggle(
      container,
      "You are subscribed for x2 for this drop.",
      true
    );
    expect(screen.queryByText("Balance")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage" })).toHaveAttribute(
      "href",
      "/test-handle/subscriptions"
    );
    expect(
      screen.getByLabelText("Learn more about The Memes subscriptions")
    ).toHaveAttribute("href", "/about/subscriptions");
  });

  it("uses a provided token id for upcoming subscription state", () => {
    renderWithAuth(<LatestDropNextMintSubscribe tokenId={516} />);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["mint-subscription-status", "upcoming", "test-key", 516],
        enabled: true,
      })
    );
  });

  it("keeps the info link stable while subscriber count loads", () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (
        queryKey[0] === "mint-subscription-status" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: {
            subscribed: true,
            eligibility: 3,
            count: 1,
          },
        };
      }

      if (
        queryKey[0] === "mint-subscription-counts" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: undefined,
          isLoading: true,
        };
      }

      return {
        data: null,
      };
    });

    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(
      screen.getByRole("status", { name: "Loading subscriber count" })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Learn more about The Memes subscriptions")
    ).toHaveAttribute("href", "/about/subscriptions");
  });

  it("renders connected dropped awareness without upcoming status lookup when status source is none", () => {
    const { container } = renderWithAuth(
      <LatestDropNextMintSubscribe tokenId={516} readonly statusSource="none" />
    );

    expect(screen.getByText("Subscription Minting")).toBeInTheDocument();
    expect(screen.getByText("x9 subscribers")).toBeInTheDocument();
    expect(
      screen.queryByText("Cannot change active drops")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Balance")).not.toBeInTheDocument();
    expectReadonlySubscriptionToggle(
      container,
      "Subscription minting is closed for this drop.",
      false
    );
    expect(screen.getByRole("link", { name: "Set up" })).toHaveAttribute(
      "href",
      "/test-handle/subscriptions"
    );
    expect(
      screen.getByLabelText("Learn more about The Memes subscriptions")
    ).toHaveAttribute("href", "/about/subscriptions");
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["mint-subscription-status", "upcoming", "test-key", 516],
        enabled: false,
      })
    );
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["mint-subscription-counts", "redeemed", "test-key", 516],
      })
    );
  });

  it("shows finalized subscription count for dropped cards when available", () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (
        queryKey[0] === "mint-subscription-status" &&
        queryKey[1] === "final"
      ) {
        return {
          data: {
            subscribed_count: 3,
          },
        };
      }

      if (
        queryKey[0] === "mint-subscription-counts" &&
        queryKey[1] === "redeemed"
      ) {
        return {
          data: {
            data: [{ token_id: 516, count: 9 }],
          },
        };
      }

      return {
        data: null,
      };
    });

    const { container } = renderWithAuth(
      <LatestDropNextMintSubscribe tokenId={516} readonly statusSource="none" />
    );

    expect(screen.getByText("x3")).toBeInTheDocument();
    expect(screen.getByText("Subscription Minting")).toBeInTheDocument();
    expectReadonlySubscriptionToggle(
      container,
      "You are subscribed for x3 for this drop.",
      true
    );
  });

  it("disables retries for expected subscription lookup errors", () => {
    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          "mint-subscription-status",
          "upcoming",
          expect.any(String),
          expect.any(Number),
        ],
        retry: false,
      })
    );
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["mint-subscription-counts", "upcoming", expect.any(Number)],
        retry: false,
      })
    );
  });

  it("renders awareness when there is no connected profile", () => {
    const { container } = renderWithAuth(<LatestDropNextMintSubscribe />, {
      connectedProfile: null,
    });

    expect(screen.getByText("Subscription Minting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set up" })).toBeInTheDocument();
    expectReadonlySubscriptionToggle(
      container,
      "Connect to set up subscription minting.",
      false
    );
    fireEvent.click(screen.getByRole("button", { name: "Set up" }));
    expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);
    expect(
      screen.getByLabelText("Learn more about The Memes subscriptions")
    ).toHaveAttribute("href", "/about/subscriptions");
  });

  it("renders awareness during an active proxy session", () => {
    const { container } = renderWithAuth(<LatestDropNextMintSubscribe />, {
      activeProfileProxy: {
        id: "proxy-1",
        granted_to: {} as any,
        created_at: Date.now(),
        created_by: {} as any,
        actions: [],
      } as any,
    });

    expectReadonlySubscriptionToggle(
      container,
      "Manage subscriptions from your own profile, not a proxy session.",
      false
    );
    expect(screen.getByText("Subscription Minting")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set up" })).toHaveAttribute(
      "href",
      "/test-handle/subscriptions"
    );
  });

  it("renders upcoming state when the profile is not subscribed", () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (
        queryKey[0] === "mint-subscription-status" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: {
            subscribed: false,
            eligibility: 2,
            count: 1,
          },
        };
      }

      if (
        queryKey[0] === "mint-subscription-counts" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: [{ token_id: 478, count: 12 }],
        };
      }

      return {
        data: null,
      };
    });

    const { container } = renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(screen.getByText("Subscription Minting")).toBeInTheDocument();
    expect(screen.queryByText("x1")).not.toBeInTheDocument();
    expectReadonlySubscriptionToggle(
      container,
      "You are not subscribed for this drop.",
      false
    );
    expect(screen.getByRole("link", { name: "Set up" })).toHaveAttribute(
      "href",
      "/test-handle/subscriptions"
    );
  });

  it("renders mint-day messaging when subscription changes are closed", () => {
    isMintingTodayMock.mockReturnValue(true);
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (
        queryKey[0] === "mint-subscription-status" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: {
            subscribed: false,
            eligibility: 2,
            count: 1,
          },
        };
      }

      if (
        queryKey[0] === "mint-subscription-counts" &&
        queryKey[1] === "upcoming"
      ) {
        return {
          data: [{ token_id: 478, count: 12 }],
        };
      }

      return {
        data: null,
      };
    });

    const { container } = renderWithAuth(<LatestDropNextMintSubscribe />);

    expectReadonlySubscriptionToggle(
      container,
      "Subscription minting cannot be changed on mint day.",
      false
    );
    expect(screen.getByRole("link", { name: "Set up" })).toHaveAttribute(
      "href",
      "/test-handle/subscriptions"
    );
  });
});
