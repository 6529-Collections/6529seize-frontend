import { renderWithAuth } from "@/__tests__/utils/testContexts";
import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import { useQuery } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";

type LinkMockProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: LinkMockProps) => (
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
    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    expect(screen.getByText("Subscribers count 12")).toBeInTheDocument();
    expect(screen.getByText("2x")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", {
        name: "Manage this in profile subscriptions.",
      })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("switch", {
        name: "Manage this in profile subscriptions.",
      })
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByText("Balance")).not.toBeInTheDocument();
    expect(screen.getByLabelText("My subscriptions")).toHaveAttribute(
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

  it("renders connected dropped awareness without upcoming status lookup when status source is none", () => {
    renderWithAuth(
      <LatestDropNextMintSubscribe tokenId={516} readonly statusSource="none" />
    );

    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    expect(screen.getByText("Subscribers count 9")).toBeInTheDocument();
    expect(
      screen.queryByText("Cannot change active drops")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Balance")).not.toBeInTheDocument();
    expect(
      screen.getByRole("switch", {
        name: "This card has already dropped and can no longer be subscribed to.",
      })
    ).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByRole("switch", {
        name: "This card has already dropped and can no longer be subscribed to.",
      })
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByLabelText("My subscriptions")).toHaveAttribute(
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

    renderWithAuth(
      <LatestDropNextMintSubscribe tokenId={516} readonly statusSource="none" />
    );

    expect(screen.getByText("3x")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", {
        name: "Manage this in profile subscriptions.",
      })
    ).toHaveAttribute("aria-checked", "true");
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
    renderWithAuth(<LatestDropNextMintSubscribe />, {
      connectedProfile: null,
    });

    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Connect to subscribe" })
    ).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByRole("switch", { name: "Connect to subscribe" })
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByLabelText("My subscriptions")).not.toBeInTheDocument();
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

    expect(
      screen.getByRole("switch", {
        name: "Manage subscriptions from your own profile, not a proxy session.",
      })
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.getByLabelText("My subscriptions")).toHaveAttribute(
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

    renderWithAuth(<LatestDropNextMintSubscribe />);

    expect(screen.queryByText("1x")).not.toBeInTheDocument();
    expect(
      screen.getByRole("switch", {
        name: "Go to profile subscriptions to subscribe.",
      })
    ).toHaveAttribute("aria-checked", "false");
  });
});
