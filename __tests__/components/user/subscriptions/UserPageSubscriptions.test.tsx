import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageSubscriptions from "@/components/user/subscriptions/UserPageSubscriptions";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { renderWithQueryClient } from "@/__tests__/utils/reactQuery";
import { AuthContext } from "@/components/auth/Auth";
import type { ContextType, ReactElement, ReactNode } from "react";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import * as commonApi from "@/services/api/common-api";
import * as memeCalendarHelpers from "@/components/meme-calendar/meme-calendar.helpers";

function renderWithAuth(
  component: ReactElement,
  authValue: Partial<ContextType<typeof AuthContext>> = {}
) {
  return renderWithQueryClient(component, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={createMockAuthContext(authValue)}>
        {children}
      </AuthContext.Provider>
    ),
  });
}

const mockCoverageRefetch = jest.fn();
let mockCoverageStatus: Status | undefined;
let mockCoverageIsError = false;

// Mock child components
jest.mock(
  "@/components/user/subscriptions/UserPageSubscriptionsBalance",
  () => ({
    __esModule: true,
    default: ({ fetching, refresh, show_refresh }: any) => (
      <div data-testid="subscriptions-balance">
        Balance Component - Fetching: {fetching ? "true" : "false"}
        {show_refresh && <button onClick={refresh}>Refresh</button>}
      </div>
    ),
  })
);

jest.mock("@/components/user/subscriptions/UserPageSubscriptionsMode", () => ({
  __esModule: true,
  default: ({ profileKey, readonly }: any) => (
    <div data-testid="subscriptions-mode">
      Mode Component - Profile: {profileKey}, Readonly:{" "}
      {readonly ? "true" : "false"}
    </div>
  ),
}));

jest.mock("@/components/user/subscriptions/UserPageSubscriptionsTopUp", () => ({
  __esModule: true,
  default: ({
    onTransactionConfirmed,
    expanded,
  }: {
    onTransactionConfirmed: () => void;
    expanded: boolean;
  }) => (
    <div data-testid="subscriptions-topup" data-expanded={expanded}>
      TopUp Component
      <button onClick={onTransactionConfirmed}>Confirm transaction</button>
    </div>
  ),
}));

jest.mock(
  "@/components/user/subscriptions/coverage/SubscriptionCoverageSummary",
  () => ({
    __esModule: true,
    default: ({ action, topUpAction, children }: any) => (
      <div data-testid="subscription-coverage-summary">
        Coverage summary{action}
        {topUpAction}
        {children}
      </div>
    ),
  })
);

jest.mock(
  "@/components/user/subscriptions/coverage/useSubscriptionCoverage",
  () => ({
    useSubscriptionCoverage: () => ({
      data: mockCoverageStatus ? { status: mockCoverageStatus } : undefined,
      isError: mockCoverageIsError,
      isLoading: false,
      refetch: mockCoverageRefetch,
    }),
  })
);

jest.mock(
  "@/components/user/subscriptions/UserPageSubscriptionsUpcoming",
  () => ({
    __esModule: true,
    default: ({ memes_subscriptions }: any) => (
      <div data-testid="subscriptions-upcoming">
        Upcoming Component - Memes: {memes_subscriptions?.length || 0}
      </div>
    ),
  })
);

jest.mock(
  "@/components/user/subscriptions/UserPageSubscriptionsHistory",
  () => ({
    __esModule: true,
    default: ({
      onSelectionChange,
      topups,
      redeemed,
      logs,
      setRedeemedPage,
      setTopUpPage,
      setLogsPage,
    }: any) => (
      <div data-testid="subscriptions-history">
        History Component - TopUps: {topups.data?.length ?? 0}, Redeemed:{" "}
        {redeemed.data?.length ?? 0}, Logs: {logs.data?.length ?? 0}
        <button onClick={() => onSelectionChange(0)}>Select Redeemed</button>
        <button onClick={() => onSelectionChange(1)}>Select Logs</button>
        <button onClick={() => onSelectionChange(2)}>Select TopUp</button>
        <button onClick={() => setTopUpPage(2)}>Load TopUp Page 2</button>
        <button onClick={() => setRedeemedPage(2)}>Load Redeemed Page 2</button>
        <button onClick={() => setLogsPage(2)}>Load Logs Page 2</button>
      </div>
    ),
  })
);

jest.mock(
  "@/components/user/subscriptions/UserPageSubscriptionsAirdropAddress",
  () => ({
    __esModule: true,
    default: ({ show_edit }: any) => (
      <div data-testid="subscriptions-airdrop">
        Airdrop Component - Edit: {show_edit ? "true" : "false"}
      </div>
    ),
  })
);

// Mock API
jest.mock("@/services/api/common-api");
const mockCommonApiFetch = commonApi.commonApiFetch as jest.MockedFunction<
  typeof commonApi.commonApiFetch
>;

// Mock meme calendar helpers
jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  getCardsRemainingUntilEndOf: jest.fn(),
  isMintingToday: jest.fn(),
}));
const mockGetCardsRemainingUntilEndOf =
  memeCalendarHelpers.getCardsRemainingUntilEndOf as jest.MockedFunction<
    typeof memeCalendarHelpers.getCardsRemainingUntilEndOf
  >;
const mockIsMintingToday =
  memeCalendarHelpers.isMintingToday as jest.MockedFunction<
    typeof memeCalendarHelpers.isMintingToday
  >;

describe("UserPageSubscriptions", () => {
  const mockProfile: ApiIdentity = {
    consolidation_key: "test-key",
    wallets: [{ wallet: "wallet1" }, { wallet: "wallet2" }],
  } as ApiIdentity;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCoverageStatus = undefined;
    mockCoverageIsError = false;
    mockCommonApiFetch.mockResolvedValue([]);
    mockGetCardsRemainingUntilEndOf.mockReturnValue(5);
    mockIsMintingToday.mockReturnValue(false);
  });

  it.each([true, false])(
    "shows stale coverage above the cards with owner-only retry (owner: %s)",
    async (owner) => {
      mockCoverageStatus = Status.Covered;
      mockCoverageIsError = true;
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: owner ? mockProfile : null,
      });
      const notice = screen.getByRole("status");
      expect(notice).toHaveTextContent(
        "Last known coverage is shown and may be out of date."
      );
      expect(
        notice.compareDocumentPosition(
          screen.getByTestId("subscription-coverage-summary")
        ) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      const retry = screen.queryByRole("button", { name: "Refresh coverage" });
      if (owner) {
        expect(retry).toBeVisible();
        await userEvent.setup().click(retry!);
        expect(mockCoverageRefetch).toHaveBeenCalledTimes(1);
      } else {
        expect(retry).not.toBeInTheDocument();
      }
    }
  );

  describe("Profile Key Generation", () => {
    it("should generate profile key from consolidation_key when available", () => {
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      expect(screen.getByTestId("subscriptions-mode")).toHaveTextContent(
        "Profile: test-key"
      );
    });

    it("should generate profile key from wallets when consolidation_key is missing", () => {
      const profileWithoutKey = {
        ...mockProfile,
        consolidation_key: undefined as any,
      };

      renderWithAuth(<UserPageSubscriptions profile={profileWithoutKey} />, {
        connectedProfile: null,
      });

      expect(screen.getByTestId("subscriptions-mode")).toHaveTextContent(
        "Profile: wallet1-wallet2"
      );
    });

    it("should not render when profile key cannot be generated", () => {
      const emptyProfile = {} as ApiIdentity;

      const { container } = renderWithAuth(
        <UserPageSubscriptions profile={emptyProfile} />,
        { connectedProfile: null }
      );

      expect(container.innerHTML).toBe("");
    });
  });

  describe("Connected Account Detection", () => {
    it.each([Status.NotSetUp, Status.NoUpcomingSelections])(
      "opens top up from its button for an owner in %s",
      async (status) => {
        mockCoverageStatus = status;
        renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
          connectedProfile: mockProfile,
        });
        expect(screen.getByTestId("subscriptions-topup")).toHaveAttribute(
          "data-expanded",
          "false"
        );
        await userEvent.click(screen.getByRole("button", { name: "Top up" }));
        expect(screen.getByTestId("subscriptions-topup")).toHaveAttribute(
          "data-expanded",
          "true"
        );
      }
    );

    it.each([Status.NotSetUp, Status.NoUpcomingSelections])(
      "keeps top up absent for a visitor in %s",
      (status) => {
        mockCoverageStatus = status;
        renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
          connectedProfile: null,
        });
        expect(
          screen.queryByTestId("subscriptions-topup")
        ).not.toBeInTheDocument();
      }
    );

    it("keeps top up in the dialog for a funded owner", () => {
      mockCoverageStatus = Status.Covered;
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: mockProfile,
      });
      expect(screen.getByTestId("subscriptions-topup")).toHaveAttribute(
        "data-expanded",
        "false"
      );
      expect(
        screen.getByRole("button", { name: "Top up" })
      ).toBeInTheDocument();
    });

    it("opens the existing top-up flow from the status card", async () => {
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: mockProfile,
        activeProfileProxy: null,
      });
      expect(screen.getByTestId("subscriptions-topup")).toHaveAttribute(
        "data-expanded",
        "false"
      );
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Top up" }));
      expect(screen.getByTestId("subscriptions-topup")).toHaveAttribute(
        "data-expanded",
        "true"
      );
    });

    it("should detect connected account with matching consolidation keys", () => {
      const connectedProfile = { consolidation_key: "test-key" } as ApiIdentity;

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile,
        activeProfileProxy: null,
      });

      expect(screen.getByTestId("subscriptions-mode")).toHaveTextContent(
        "Readonly: false"
      );
      expect(screen.getByTestId("subscriptions-topup")).toBeInTheDocument();
    });

    it("should detect connected account with matching wallet addresses", () => {
      const connectedProfile = {
        consolidation_key: undefined as any,
        wallets: [{ wallet: "wallet1" }, { wallet: "wallet2" }],
      } as ApiIdentity;
      const profileWithoutKey = {
        consolidation_key: undefined as any,
        wallets: [{ wallet: "wallet1" }, { wallet: "wallet2" }],
      } as ApiIdentity;

      renderWithAuth(<UserPageSubscriptions profile={profileWithoutKey} />, {
        connectedProfile,
        activeProfileProxy: null,
      });

      expect(screen.getByTestId("subscriptions-mode")).toHaveTextContent(
        "Readonly: false"
      );
    });

    it("should set readonly mode for non-connected accounts", () => {
      const differentProfile = {
        consolidation_key: "different-key",
      } as ApiIdentity;

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: differentProfile,
        activeProfileProxy: null,
      });

      expect(screen.getByTestId("subscriptions-mode")).toHaveTextContent(
        "Readonly: true"
      );
      expect(
        screen.queryByTestId("subscriptions-topup")
      ).not.toBeInTheDocument();
    });

    it("should disable functionality when active profile proxy exists", () => {
      const connectedProfile = { consolidation_key: "test-key" } as ApiIdentity;

      const { container } = renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        {
          connectedProfile,
          activeProfileProxy: {
            id: "proxy-1",
            granted_to: {} as any,
            created_at: Date.now(),
            created_by: {} as any,
            actions: [],
          } as any,
        }
      );

      // When activeProfileProxy exists, the component returns early and doesn't render
      expect(container.innerHTML).toBe("");
    });
  });

  describe("API Data Fetching", () => {
    it("fetches overview data and only redeemed history on mount", async () => {
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: "subscriptions/consolidation/details/test-key",
          signal: expect.any(AbortSignal),
        });
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: "subscriptions/consolidation/test-key/airdrop-address",
          signal: expect.any(AbortSignal),
        });
        expect(mockCommonApiFetch).not.toHaveBeenCalledWith(
          expect.objectContaining({
            endpoint:
              "subscriptions/consolidation/top-up/test-key?page=1&page_size=10",
          })
        );
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint:
            "subscriptions/consolidation/upcoming-memes/test-key?card_count=5",
          signal: expect.any(AbortSignal),
        });
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint:
            "subscriptions/consolidation/redeemed/test-key?page=1&page_size=10",
          signal: expect.any(AbortSignal),
        });
        expect(mockCommonApiFetch).not.toHaveBeenCalledWith(
          expect.objectContaining({
            endpoint:
              "subscriptions/consolidation/logs/test-key?page=1&page_size=10",
          })
        );
      });
    });

    it("should adjust meme subscriptions limit when minting today", async () => {
      mockIsMintingToday.mockReturnValue(true);

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint:
            "subscriptions/consolidation/upcoming-memes/test-key?card_count=6",
          signal: expect.any(AbortSignal),
        });
      });
    });

    it("shows a retry warning when a subscription read fails and recovers", async () => {
      mockCommonApiFetch.mockRejectedValue(new Error("API Error"));
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Some subscription data could not be refreshed."
        )
      );
      expect(screen.getByTestId("subscriptions-balance")).toHaveTextContent(
        "Fetching: false"
      );
      mockCommonApiFetch.mockResolvedValue([]);
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Retry" }));
      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
      );
    });
  });

  describe("Refresh Functionality", () => {
    it("refreshes overview and selected history without requesting unopened histories", async () => {
      const user = userEvent.setup();

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: { consolidation_key: "test-key" } as ApiIdentity,
      });

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledTimes(4);
      });
      jest.clearAllMocks();

      await user.click(screen.getByText("Refresh"));
      expect(mockCoverageRefetch).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledTimes(4);
      });
    });
  });

  it("invalidates histories through the confirmed-transaction callback", async () => {
    const user = userEvent.setup();
    renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
      connectedProfile: mockProfile,
    });
    await waitFor(() => expect(mockCommonApiFetch).toHaveBeenCalledTimes(4));
    await user.click(screen.getByText("Select Logs"));
    await waitFor(() => expect(mockCommonApiFetch).toHaveBeenCalledTimes(5));
    mockCommonApiFetch.mockClear();
    await user.click(screen.getByText("Confirm transaction"));
    await waitFor(() => expect(mockCommonApiFetch).toHaveBeenCalledTimes(4));
    expect(mockCoverageRefetch).toHaveBeenCalledTimes(1);
    expect(mockCommonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint:
          "subscriptions/consolidation/logs/test-key?page=1&page_size=10",
      })
    );
    expect(mockCommonApiFetch).not.toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: expect.stringContaining("/top-up/") })
    );
    await user.click(screen.getByText("Select Redeemed"));
    await waitFor(() => expect(mockCommonApiFetch).toHaveBeenCalledTimes(5));
  });

  describe("Pagination Handlers", () => {
    it("should handle top-up history pagination", async () => {
      const user = userEvent.setup();

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      jest.clearAllMocks();

      expect(
        screen.getByRole("region", { name: "Subscription History" })
      ).toBeVisible();
      await user.click(screen.getByText("Select TopUp"));
      await user.click(screen.getByText("Load TopUp Page 2"));

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint:
            "subscriptions/consolidation/top-up/test-key?page=2&page_size=10",
          signal: expect.any(AbortSignal),
        });
      });
    });

    it("should handle redeemed history pagination", async () => {
      const user = userEvent.setup();

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      jest.clearAllMocks();

      expect(
        screen.getByRole("region", { name: "Subscription History" })
      ).toBeVisible();
      await user.click(screen.getByText("Select Redeemed"));
      await user.click(screen.getByText("Load Redeemed Page 2"));

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint:
            "subscriptions/consolidation/redeemed/test-key?page=2&page_size=10",
          signal: expect.any(AbortSignal),
        });
      });
    });

    it("should handle logs pagination", async () => {
      const user = userEvent.setup();

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      jest.clearAllMocks();

      expect(
        screen.getByRole("region", { name: "Subscription History" })
      ).toBeVisible();
      await user.click(screen.getByText("Select Logs"));
      await user.click(screen.getByText("Load Logs Page 2"));

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint:
            "subscriptions/consolidation/logs/test-key?page=2&page_size=10",
          signal: expect.any(AbortSignal),
        });
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state when any fetch is in progress", () => {
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      expect(screen.getByTestId("subscriptions-balance")).toHaveTextContent(
        "Fetching: true"
      );
    });

    it("should clear loading state when all fetches complete", async () => {
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      await waitFor(() => {
        expect(screen.getByTestId("subscriptions-balance")).toHaveTextContent(
          "Fetching: false"
        );
      });
    });
  });

  describe("Component Integration", () => {
    it("should pass correct props to child components", async () => {
      const connectedProfile = { consolidation_key: "test-key" } as ApiIdentity;

      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile,
        activeProfileProxy: null,
      });

      await waitFor(() => {
        expect(screen.getByTestId("subscriptions-balance")).toHaveTextContent(
          "Fetching: false"
        );
        expect(screen.getByTestId("subscriptions-mode")).toHaveTextContent(
          "Readonly: false"
        );
        expect(screen.getByTestId("subscriptions-airdrop")).toHaveTextContent(
          "Edit: true"
        );
        expect(screen.getByTestId("subscriptions-upcoming")).toHaveTextContent(
          "Memes: 0"
        );
      });
    });

    it("should render learn more link", () => {
      renderWithAuth(<UserPageSubscriptions profile={mockProfile} />, {
        connectedProfile: null,
      });

      const learnMoreLink = screen.getByRole("link", {
        name: "Learn more",
      });
      expect(learnMoreLink).toHaveAttribute("href", "/about/subscriptions");
    });
  });

  describe("Edge Cases", () => {
    it("should handle profile changes", async () => {
      const { rerender } = renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      const newProfile = {
        ...mockProfile,
        consolidation_key: "new-key",
      } as ApiIdentity;

      jest.clearAllMocks();

      rerender(<UserPageSubscriptions profile={newProfile} />);

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: "subscriptions/consolidation/details/new-key",
          signal: expect.any(AbortSignal),
        });
      });
    });

    it("should clear history and upcoming memes when their requests fail after a profile change", async () => {
      const page = { count: 1, page: 1, next: false, data: [{ id: 1 }] };
      mockCommonApiFetch.mockImplementation(async ({ endpoint }) => {
        if (endpoint.includes("new-key")) {
          throw new Error("API Error");
        }
        if (endpoint.includes("upcoming-memes")) {
          return [{ id: 1 }];
        }
        return page;
      });

      const { rerender } = renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      await waitFor(() => {
        expect(screen.getByTestId("subscriptions-history")).toHaveTextContent(
          "TopUps: 0, Redeemed: 1, Logs: 0"
        );
        expect(screen.getByTestId("subscriptions-upcoming")).toHaveTextContent(
          "Memes: 1"
        );
      });

      rerender(
        <UserPageSubscriptions
          profile={
            { ...mockProfile, consolidation_key: "new-key" } as ApiIdentity
          }
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("subscriptions-history")).toHaveTextContent(
          "TopUps: 0, Redeemed: 0, Logs: 0"
        );
        expect(screen.getByTestId("subscriptions-upcoming")).toHaveTextContent(
          "Memes: 0"
        );
      });
    });

    it("should ignore a superseded profile request that settles after the current one", async () => {
      const oldUpcoming: { reject?: (error: Error) => void } = {};
      const page = { count: 1, page: 1, next: false, data: [{ id: 1 }] };
      mockCommonApiFetch.mockImplementation(async ({ endpoint }) => {
        if (endpoint.includes("upcoming-memes/test-key")) {
          // Settles only after the newer profile's request and ignores the
          // abort, so the stale failure still reaches the component.
          return new Promise((_resolve, reject) => {
            oldUpcoming.reject = reject;
          });
        }
        if (endpoint.includes("upcoming-memes/new-key")) {
          return [{ id: 1 }, { id: 2 }];
        }
        return page;
      });

      const { rerender } = renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );
      await waitFor(() => expect(oldUpcoming.reject).toBeDefined());

      rerender(
        <UserPageSubscriptions
          profile={
            { ...mockProfile, consolidation_key: "new-key" } as ApiIdentity
          }
        />
      );
      await waitFor(() => {
        expect(screen.getByTestId("subscriptions-upcoming")).toHaveTextContent(
          "Memes: 2"
        );
      });

      await act(async () => {
        oldUpcoming.reject?.(new Error("Old profile request failed"));
      });

      expect(screen.getByTestId("subscriptions-upcoming")).toHaveTextContent(
        "Memes: 2"
      );
    });

    it("should not fetch when profile key is undefined", () => {
      const profileWithoutData = {} as ApiIdentity;

      renderWithAuth(<UserPageSubscriptions profile={profileWithoutData} />, {
        connectedProfile: null,
      });

      expect(mockCommonApiFetch).not.toHaveBeenCalled();
    });
  });
});
