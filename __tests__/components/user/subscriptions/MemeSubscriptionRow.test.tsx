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
});
