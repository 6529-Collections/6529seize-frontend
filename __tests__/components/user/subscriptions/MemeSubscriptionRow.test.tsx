import { renderWithAuth } from "@/__tests__/utils/testContexts";
import MemeSubscriptionRow from "@/components/user/subscriptions/MemeSubscriptionRow";
import { useQuery } from "@tanstack/react-query";
import { screen } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;

describe("MemeSubscriptionRow", () => {
  beforeEach(() => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "consolidation-final-subscription") {
        return {
          data: {
            phase: "Phase 1",
            phase_position: 4,
            phase_subscriptions: 12,
            airdrop_address: "0xabc123",
            subscribed_count: 2,
          },
        };
      }

      return {
        data: null,
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows the subscribed compact view without toggle controls", () => {
    renderWithAuth(
      <MemeSubscriptionRow
        profileKey="test-key"
        title="The Memes"
        subscription={
          {
            token_id: 478,
            contract: "0x123",
            subscribed: true,
            subscribed_count: 2,
          } as any
        }
        eligibilityCount={3}
        readonly
        refresh={jest.fn()}
        minting_today={false}
        first
        date={null}
        variant="compact"
        balanceLabel="0.1"
        subscribedView
      />
    );

    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Toggle subscription for The Memes #478/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Select subscription quantity for The Memes/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Phase: Phase 1 - Subscription Position: 4 \/ 12/)
    ).toBeInTheDocument();
  });

  it("renders the compact balance label", () => {
    renderWithAuth(
      <MemeSubscriptionRow
        profileKey="test-key"
        title="The Memes"
        subscription={
          {
            token_id: 478,
            contract: "0x123",
            subscribed: true,
            subscribed_count: 2,
          } as any
        }
        eligibilityCount={3}
        readonly
        refresh={jest.fn()}
        minting_today={false}
        first
        date={null}
        variant="compact"
        balanceLabel="0.5"
        subscribedView
      />
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
  });

  it("disables retries for final subscription lookups", () => {
    renderWithAuth(
      <MemeSubscriptionRow
        profileKey="test-key"
        title="The Memes"
        subscription={
          {
            token_id: 478,
            contract: "0x123",
            subscribed: true,
            subscribed_count: 2,
          } as any
        }
        eligibilityCount={3}
        readonly
        refresh={jest.fn()}
        minting_today={false}
        first
        date={null}
      />
    );

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["consolidation-final-subscription", "test-key-0x123-478"],
        enabled: true,
        retry: false,
      })
    );
  });

  it("omits phase metadata when the final subscription is unavailable", () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "consolidation-final-subscription") {
        return { data: null };
      }

      return {
        data: null,
      };
    });

    renderWithAuth(
      <MemeSubscriptionRow
        profileKey="test-key"
        title="The Memes"
        subscription={
          {
            token_id: 478,
            contract: "0x123",
            subscribed: true,
            subscribed_count: 2,
          } as any
        }
        eligibilityCount={3}
        readonly
        refresh={jest.fn()}
        minting_today={false}
        first
        date={null}
        variant="compact"
        balanceLabel="0.5"
        subscribedView
      />
    );

    expect(screen.queryByText(/Phase:/)).not.toBeInTheDocument();
  });
});
