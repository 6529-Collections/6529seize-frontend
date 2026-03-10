import UserPageCollectedStats from "@/components/user/collected/UserPageCollectedStats";
import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

jest.mock("@/components/user/stats/UserPageStatsDetailsContent", () => ({
  __esModule: true,
  default: () => <div data-testid="details" />,
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const apiMock = commonApiFetch as jest.Mock;

const profile = {
  handle: "punk6529",
  wallets: [{ wallet: "0x1" }],
  consolidation_key: "key",
} as any;

const collectedStats = {
  boost: 1.76,
  nextgen_balance: 62,
  gradients_balance: 3,
  memes_balance: 3107,
  unique_memes: 465,
  seasons: [
    {
      season: "Season 1",
      total_cards_in_season: 47,
      sets_held: 1,
      partial_set_unique_cards_held: 0,
      total_cards_held: 748,
    },
    {
      season: "Season 2",
      total_cards_in_season: 39,
      sets_held: 1,
      partial_set_unique_cards_held: 26,
      total_cards_held: 1413,
    },
    {
      season: "Season 3",
      total_cards_in_season: 32,
      sets_held: 0,
      partial_set_unique_cards_held: 0,
      total_cards_held: 0,
    },
  ],
} as const;

const buildInitialStatsData = (
  overrides: Partial<UserPageStatsInitialData> = {}
): UserPageStatsInitialData => ({
  initialActiveAddress: null,
  initialCollectedStats: collectedStats as any,
  initialSeasons: [],
  initialTdh: undefined,
  initialOwnerBalance: undefined,
  initialBalanceMemes: [],
  ...overrides,
});

const renderWithQueryClient = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("UserPageCollectedStats", () => {
  beforeEach(() => {
    apiMock.mockClear();
    apiMock.mockResolvedValue({});
  });

  it("renders the new collected header metrics and season states", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData()}
      />
    );

    expect(screen.getByText("NextGen")).toBeInTheDocument();
    expect(screen.getByText("x62")).toBeInTheDocument();
    expect(screen.queryByText("Meme Sets")).not.toBeInTheDocument();
    expect(screen.getByText("Memes")).toBeInTheDocument();
    expect(screen.getByText("x3,107")).toBeInTheDocument();
    expect(screen.getByText("unique x465")).toBeInTheDocument();
    expect(screen.getByText("Seasons")).toBeInTheDocument();
    expect(screen.getByText("2/3 started")).toBeInTheDocument();
    expect(screen.getByText("SZN1")).toBeInTheDocument();
    expect(screen.getByText("SZN2")).toBeInTheDocument();
    expect(screen.getByText("Unseized")).toBeInTheDocument();
    expect(screen.getByText("SZN3")).toBeInTheDocument();
    expect(screen.getByText("Set 1 complete")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /szn2/i }));
    expect(screen.getByText("26/39 to set 2")).toBeInTheDocument();
  });

  it("derives Meme Sets as the minimum full-set count across valid seasons", () => {
    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData({
          initialCollectedStats: {
            ...collectedStats,
            seasons: [
              {
                season: "Season 1",
                total_cards_in_season: 47,
                sets_held: 1,
                partial_set_unique_cards_held: 0,
                total_cards_held: 748,
              },
              {
                season: "Season 2",
                total_cards_in_season: 39,
                sets_held: 2,
                partial_set_unique_cards_held: 26,
                total_cards_held: 1413,
              },
              {
                season: "Season 3",
                total_cards_in_season: 32,
                sets_held: 1,
                partial_set_unique_cards_held: 5,
                total_cards_held: 242,
              },
            ],
          } as any,
        })}
      />
    );

    expect(screen.getByText("Meme Sets")).toBeInTheDocument();
    expect(screen.getByText("x1")).toBeInTheDocument();
  });

  it("ignores invalid zero seasons in the header and counts", () => {
    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData({
          initialCollectedStats: {
            ...collectedStats,
            seasons: [
              ...collectedStats.seasons,
              {
                season: "Season 0",
                total_cards_in_season: 0,
                sets_held: 0,
                partial_set_unique_cards_held: 0,
                total_cards_held: 0,
              },
            ],
          } as any,
        })}
      />
    );

    expect(screen.queryByText("SZN0")).not.toBeInTheDocument();
    expect(screen.getByText("2/3 started")).toBeInTheDocument();
  });

  it("collapses overflowing started seasons behind a see more control on desktop", async () => {
    const user = userEvent.setup();
    const originalInnerWidth = window.innerWidth;
    const originalGetComputedStyle = window.getComputedStyle;
    const clientWidthSpy = jest
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.hasAttribute("data-season-tile") ? 72 : 372;
      });
    const getBoundingClientRectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const width = this.hasAttribute("data-season-tile") ? 72 : 372;
        return {
          width,
          height: 0,
          top: 0,
          left: 0,
          right: width,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      });
    const getComputedStyleSpy = jest
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element) => {
        const styles = originalGetComputedStyle(element);
        return {
          ...styles,
          columnGap: "12px",
          gap: "12px",
          getPropertyValue: (property: string) => {
            if (property === "column-gap" || property === "gap") {
              return "12px";
            }
            return styles.getPropertyValue(property);
          },
        } as CSSStyleDeclaration;
      });

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });

    try {
      renderWithQueryClient(
        <UserPageCollectedStats
          profile={profile}
          activeAddress={null}
          initialStatsData={buildInitialStatsData({
            initialCollectedStats: {
              ...collectedStats,
              seasons: [
                {
                  season: "Season 1",
                  total_cards_in_season: 47,
                  sets_held: 1,
                  partial_set_unique_cards_held: 0,
                  total_cards_held: 748,
                },
                {
                  season: "Season 2",
                  total_cards_in_season: 39,
                  sets_held: 1,
                  partial_set_unique_cards_held: 26,
                  total_cards_held: 1413,
                },
                {
                  season: "Season 3",
                  total_cards_in_season: 32,
                  sets_held: 1,
                  partial_set_unique_cards_held: 0,
                  total_cards_held: 320,
                },
                {
                  season: "Season 4",
                  total_cards_in_season: 33,
                  sets_held: 1,
                  partial_set_unique_cards_held: 5,
                  total_cards_held: 333,
                },
                {
                  season: "Season 5",
                  total_cards_in_season: 34,
                  sets_held: 1,
                  partial_set_unique_cards_held: 9,
                  total_cards_held: 340,
                },
                {
                  season: "Season 6",
                  total_cards_in_season: 35,
                  sets_held: 1,
                  partial_set_unique_cards_held: 12,
                  total_cards_held: 350,
                },
              ],
            } as any,
          })}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: "Show 2 more started seasons",
          })
        ).toBeInTheDocument();
      });

      expect(screen.getByText("+2 more")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: /szn6/i,
        })
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", {
          name: "Show 2 more started seasons",
        })
      );

      expect(
        screen.getByRole("button", {
          name: /szn6/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Show less",
        })
      ).toBeInTheDocument();
    } finally {
      clientWidthSpy.mockRestore();
      getBoundingClientRectSpy.mockRestore();
      getComputedStyleSpy.mockRestore();
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: originalInnerWidth,
      });
    }
  });

  it("fetches only collected-stats when the collected address changes while details are closed", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <UserPageCollectedStats
          profile={profile}
          activeAddress={null}
          initialStatsData={buildInitialStatsData()}
        />
      </QueryClientProvider>
    );

    expect(apiMock).not.toHaveBeenCalled();

    rerender(
      <QueryClientProvider client={queryClient}>
        <UserPageCollectedStats
          profile={profile}
          activeAddress={"0x0000000000000000000000000000000000000001"}
          initialStatsData={buildInitialStatsData()}
        />
      </QueryClientProvider>
    );

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(apiMock.mock.calls[0]?.[0]?.endpoint).toBe(
      "collected-stats/0x0000000000000000000000000000000000000001"
    );
  });

  it("starts legacy stats fetches only when details are opened", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData()}
      />
    );

    expect(apiMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Details" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(4));

    const endpoints = apiMock.mock.calls.map((call) => call[0].endpoint);
    expect(endpoints).toEqual([
      "new_memes_seasons",
      "tdh/consolidation/key",
      "owners-balances/consolidation/key",
      "owners-balances/consolidation/key/memes",
    ]);
    expect(screen.getByTestId("details")).toBeInTheDocument();
  });
});
