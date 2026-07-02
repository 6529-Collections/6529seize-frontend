import { renderWithAuth } from "@/__tests__/utils/testContexts";
import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import { useQuery } from "@tanstack/react-query";
import { screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
}));

jest.mock(
  "@/components/user/subscriptions/MemeSubscriptionRow",
  () =>
    function MockMemeSubscriptionRow(props: any) {
      return (
        <div data-testid="meme-subscription-row">
          token:{props.subscription.token_id} eligibility:
          {props.eligibilityCount}
          minting_today:{String(props.minting_today)} readonly:
          {String(props.readonly)} balance:{props.balanceLabel} variant:
          {props.variant ?? "default"} date:{String(props.date)} info:
          {props.infoHref} profile:{props.profileSubscriptionsHref}
        </div>
      );
    }
);

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

describe("LatestDropNextMintSubscribe", () => {
  beforeEach(() => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "next-mint-subscription-details") {
        return {
          data: {
            subscription_eligibility_count: 3,
          },
        };
      }

      if (queryKey[0] === "next-mint-subscription-status") {
        return {
          data: {
            subscribed: true,
            eligibility: 2,
            count: 2,
          },
          refetch: jest.fn(),
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
    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /token:478/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /eligibility:3/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /minting_today:false/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /readonly:false/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /balance:0/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /variant:compact/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /date:null/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /info:\/about\/subscriptions/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /profile:\/test-handle\/subscriptions/
    );
  });

  it("uses a provided token id for active latest-drop subscription state", () => {
    renderWithAuth(<LatestDropNextMintSubscribe tokenId={516} />);

    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /token:516/
    );
  });

  it("disables retries for expected subscription lookup errors", () => {
    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["next-mint-subscription-details", expect.any(String)],
        retry: false,
      })
    );
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          "next-mint-subscription-status",
          expect.any(String),
          expect.any(Number),
        ],
        retry: false,
      })
    );
  });

  it("falls back to status eligibility when details are unavailable", () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "next-mint-subscription-details") {
        return { data: undefined };
      }

      if (queryKey[0] === "next-mint-subscription-status") {
        return {
          data: {
            subscribed: true,
            eligibility: 2,
            count: 1,
          },
          refetch: jest.fn(),
        };
      }

      return {
        data: null,
        refetch: jest.fn(),
      };
    });

    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      "eligibility:2"
    );
  });

  it("falls back to zero balance for non-finite details", () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "next-mint-subscription-details") {
        return {
          data: {
            balance: Number.NaN,
            subscription_eligibility_count: 3,
          },
        };
      }

      if (queryKey[0] === "next-mint-subscription-status") {
        return {
          data: {
            subscribed: true,
            eligibility: 2,
            count: 1,
          },
          refetch: jest.fn(),
        };
      }

      return {
        data: null,
        refetch: jest.fn(),
      };
    });

    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      "balance:0"
    );
  });

  it("renders awareness when there is no connected profile", () => {
    renderWithAuth(<LatestDropNextMintSubscribe />, {
      connectedProfile: null,
    });

    expect(screen.getByText("Subscribe")).toBeInTheDocument();
    expect(screen.getByText("Connect profile")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Learn more about The Memes subscriptions")
    ).toHaveAttribute("href", "/about/subscriptions");
  });

  it("renders awareness during an active proxy session", () => {
    renderWithAuth(<LatestDropNextMintSubscribe />, {
      activeProfileProxy: {
        id: "proxy-1",
        granted_to: {} as any,
        created_at: Date.now(),
        created_by: {} as any,
        actions: [],
      } as any,
    });

    expect(screen.getByText("Proxy active")).toBeInTheDocument();
    expect(screen.getByText("My subscriptions")).toHaveAttribute(
      "href",
      "/test-handle/subscriptions"
    );
  });

  it("renders when the profile is not subscribed", () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "next-mint-subscription-details") {
        return {
          data: {
            subscription_eligibility_count: 3,
          },
        };
      }

      if (queryKey[0] === "next-mint-subscription-status") {
        return {
          data: {
            subscribed: false,
            eligibility: 2,
            count: 1,
          },
          refetch: jest.fn(),
        };
      }

      return {
        data: null,
        refetch: jest.fn(),
      };
    });

    renderWithAuth(<LatestDropNextMintSubscribe tokenId={516} readonly />);

    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /token:516/
    );
    expect(screen.getByTestId("meme-subscription-row")).toHaveTextContent(
      /readonly:true/
    );
  });
});
