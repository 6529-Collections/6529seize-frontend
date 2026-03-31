import UserPageCollectedStats from "@/components/user/collected/UserPageCollectedStats";
import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import { CollectedCollectionType } from "@/entities/IProfile";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useDesktopSeasonRowCapacity } from "@/components/user/collected/stats/useDesktopSeasonRowCapacity";

jest.mock("@/components/user/stats/UserPageStatsDetailsContent", () => ({
  __esModule: true,
  default: (props: {
    seasons: unknown[];
    tdh: unknown;
    ownerBalance: unknown;
    balanceMemes: unknown[];
  }) => (
    <div
      data-testid="details"
      data-seasons={props.seasons.length}
      data-has-tdh={String(Boolean(props.tdh))}
      data-has-owner-balance={String(Boolean(props.ownerBalance))}
      data-balance-memes={props.balanceMemes.length}
    />
  ),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

jest.mock(
  "@/components/user/collected/stats/useDesktopSeasonRowCapacity",
  () => ({
    useDesktopSeasonRowCapacity: jest.fn(),
  })
);

const apiMock = commonApiFetch as jest.Mock;
const useSearchParamsMock = useSearchParams as jest.Mock;
const useDesktopSeasonRowCapacityMock =
  useDesktopSeasonRowCapacity as jest.Mock;

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

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return {
    promise,
    resolve,
  };
};

describe("UserPageCollectedStats", () => {
  beforeEach(() => {
    apiMock.mockClear();
    apiMock.mockResolvedValue({});
    useSearchParamsMock.mockReturnValue({
      get: () => null,
    });
    useDesktopSeasonRowCapacityMock.mockReturnValue({
      containerRef: { current: null },
      visibleSeasonCount: null,
      isDesktopLayout: false,
    });
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

  it("uses collection shortcuts for collection-backed metrics and keeps boost informational", async () => {
    const user = userEvent.setup();
    const onCollectionShortcut = jest.fn();

    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData()}
        activeCollection={CollectedCollectionType.NEXTGEN}
        onCollectionShortcut={onCollectionShortcut}
      />
    );

    const nextGenButton = screen.getByRole("button", { name: /nextgen/i });

    expect(nextGenButton).toHaveAttribute("aria-pressed", "true");

    await user.click(nextGenButton);

    expect(onCollectionShortcut).toHaveBeenCalledWith(
      CollectedCollectionType.NEXTGEN
    );
    expect(
      screen.queryByRole("button", { name: /boost/i })
    ).not.toBeInTheDocument();
  });

  it("only applies the season shortcut on click while hover still previews details", async () => {
    const user = userEvent.setup();
    const onSeasonShortcut = jest.fn();

    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData()}
        activeSeasonNumber={2}
        onSeasonShortcut={onSeasonShortcut}
      />
    );

    const seasonButton = screen.getByRole("button", { name: /szn2/i });

    expect(seasonButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("26/39 to set 2")).toBeInTheDocument();

    await user.hover(seasonButton);

    expect(onSeasonShortcut).not.toHaveBeenCalled();
    expect(screen.getByText("26/39 to set 2")).toBeInTheDocument();

    await user.click(seasonButton);

    expect(onSeasonShortcut).toHaveBeenCalledWith(2);
  });

  it("drops stale preview state when the active season filter changes", async () => {
    const user = userEvent.setup();
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

    await user.hover(screen.getByRole("button", { name: /szn1/i }));

    expect(screen.getByText("Set 1 complete")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <UserPageCollectedStats
          profile={profile}
          activeAddress={null}
          initialStatsData={buildInitialStatsData()}
          activeSeasonNumber={2}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText("26/39 to set 2")).toBeInTheDocument();
    expect(screen.queryByText("Set 1 complete")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /szn2/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("keeps the filtered season visible in the collapsed desktop row", () => {
    useDesktopSeasonRowCapacityMock.mockReturnValue({
      containerRef: { current: null },
      visibleSeasonCount: 1,
      isDesktopLayout: true,
    });

    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData()}
        activeSeasonNumber={2}
      />
    );

    expect(screen.getByRole("button", { name: /szn2/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /szn1/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("26/39 to set 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show 1 more started seasons" })
    ).toBeInTheDocument();
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
    useDesktopSeasonRowCapacityMock.mockReturnValue({
      containerRef: { current: null },
      visibleSeasonCount: 4,
      isDesktopLayout: true,
    });
    const originalInnerWidth = globalThis.innerWidth;
    const originalGetComputedStyle = globalThis.getComputedStyle;
    const clientWidthSpy = jest
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        const isSeasonTile = Object.hasOwn(this.dataset, "seasonTile");
        return isSeasonTile ? 72 : 372;
      });
    const getBoundingClientRectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const isSeasonTile = Object.hasOwn(this.dataset, "seasonTile");
        const width = isSeasonTile ? 72 : 372;
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
      .spyOn(globalThis, "getComputedStyle")
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

    Object.defineProperty(globalThis, "innerWidth", {
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

      const showMoreButton = screen.getByRole("button", {
        name: "Show 2 more started seasons",
      });
      expect(showMoreButton).toHaveTextContent("+2 more");
      expect(showMoreButton).not.toHaveClass("tw-absolute", "tw-right-0");
      expect(showMoreButton.parentElement).toHaveClass(
        "tw-flex",
        "tw-justify-center"
      );
      expect(
        screen.queryByRole("button", {
          name: /szn6/i,
        })
      ).not.toBeInTheDocument();

      await user.click(showMoreButton);

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
      Object.defineProperty(globalThis, "innerWidth", {
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

  it("clears the previous collected stats while a new address fetch is in flight", async () => {
    const nextCollectedStatsDeferred = createDeferred<typeof collectedStats>();
    const nextCollectedStats = {
      ...collectedStats,
      nextgen_balance: 99,
      memes_balance: 99,
      unique_memes: 99,
      seasons: [],
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    apiMock.mockImplementation(({ endpoint }: { endpoint: string }) => {
      if (
        endpoint ===
        "collected-stats/0x0000000000000000000000000000000000000001"
      ) {
        return nextCollectedStatsDeferred.promise;
      }

      return Promise.resolve({});
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

    expect(screen.getByText("x62")).toBeInTheDocument();
    expect(screen.getByText("2/3 started")).toBeInTheDocument();

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
    expect(screen.queryByText("x62")).not.toBeInTheDocument();
    expect(screen.queryByText("2/3 started")).not.toBeInTheDocument();

    nextCollectedStatsDeferred.resolve(nextCollectedStats);

    await waitFor(() => expect(screen.getAllByText("x99")).toHaveLength(2));
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

  it("starts with details open when an activity query param is present", async () => {
    useSearchParamsMock.mockReturnValue({
      get: (key: string) => (key === "activity" ? "distributions" : null),
    });

    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData()}
      />
    );

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(4));

    expect(screen.getByRole("button", { name: "Hide Details" })).toBeInTheDocument();
    expect(screen.getByTestId("details")).toBeInTheDocument();
  });

  it("clears previous detail stats while the next address detail queries are in flight", async () => {
    const user = userEvent.setup();
    const nextCollectedStatsDeferred = createDeferred<Record<string, never>>();
    const nextTdhDeferred = createDeferred<{ score: number }>();
    const nextOwnerBalanceDeferred = createDeferred<{ total: number }>();
    const nextBalanceMemesDeferred = createDeferred<Array<{ id: number }>>();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    apiMock.mockImplementation(({ endpoint }: { endpoint: string }) => {
      switch (endpoint) {
        case "new_memes_seasons":
          return Promise.resolve([{ id: 1 }]);
        case "tdh/consolidation/key":
          return Promise.resolve({ score: 1 });
        case "owners-balances/consolidation/key":
          return Promise.resolve({ total: 1 });
        case "owners-balances/consolidation/key/memes":
          return Promise.resolve([{ id: 1 }]);
        case "collected-stats/0x0000000000000000000000000000000000000001":
          return nextCollectedStatsDeferred.promise;
        case "tdh/wallet/0x0000000000000000000000000000000000000001":
          return nextTdhDeferred.promise;
        case "owners-balances/wallet/0x0000000000000000000000000000000000000001":
          return nextOwnerBalanceDeferred.promise;
        case "owners-balances/wallet/0x0000000000000000000000000000000000000001/memes":
          return nextBalanceMemesDeferred.promise;
        default:
          return Promise.resolve({});
      }
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

    await user.click(screen.getByRole("button", { name: "Details" }));

    await waitFor(() =>
      expect(screen.getByTestId("details")).toHaveAttribute(
        "data-has-tdh",
        "true"
      )
    );
    expect(screen.getByTestId("details")).toHaveAttribute(
      "data-has-owner-balance",
      "true"
    );
    expect(screen.getByTestId("details")).toHaveAttribute(
      "data-balance-memes",
      "1"
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <UserPageCollectedStats
          profile={profile}
          activeAddress={"0x0000000000000000000000000000000000000001"}
          initialStatsData={buildInitialStatsData()}
        />
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("details")).toHaveAttribute(
        "data-has-tdh",
        "false"
      )
    );
    expect(screen.getByTestId("details")).toHaveAttribute(
      "data-has-owner-balance",
      "false"
    );
    expect(screen.getByTestId("details")).toHaveAttribute(
      "data-balance-memes",
      "0"
    );

    nextCollectedStatsDeferred.resolve({});
    nextTdhDeferred.resolve({ score: 2 });
    nextOwnerBalanceDeferred.resolve({ total: 2 });
    nextBalanceMemesDeferred.resolve([{ id: 2 }]);
  });
});
