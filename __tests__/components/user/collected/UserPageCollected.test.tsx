import { TransferProvider } from "@/components/nft-transfer/TransferState";
import UserPageCollected from "@/components/user/collected/UserPageCollected";
import { CollectedCollectionType } from "@/entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  keepPreviousData: jest.fn(),
}));

jest.mock(
  "@/components/user/collected/filters/UserPageCollectedFilters",
  () =>
    function MockFilters(props: any) {
      return (
        <div data-testid="filters" data-collection={props.filters.collection}>
          <button
            data-testid="filters-set-szn"
            onClick={() => props.setSzn?.({ id: 2 })}
          >
            Set season
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/user/collected/cards/UserPageCollectedCards",
  () =>
    function MockCards(props: any) {
      return (
        <div
          data-testid="cards"
          data-cards-count={props.cards.length}
          data-total-pages={props.totalPages}
          data-page={props.page}
          data-show-data-row={props.showDataRow}
        />
      );
    }
);

jest.mock(
  "@/components/user/collected/UserPageCollectedFirstLoading",
  () =>
    function MockLoading() {
      return <div data-testid="loading" />;
    }
);

jest.mock(
  "@/components/user/collected/UserPageCollectedStats",
  () =>
    function MockCollectedStats(props: any) {
      return (
        <div
          data-testid="stats-summary"
          data-active-season-number={String(props.activeSeasonNumber ?? "")}
        >
          <button
            data-testid="stats-collection-shortcut"
            onClick={() =>
              props.onCollectionShortcut?.(CollectedCollectionType.NEXTGEN)
            }
          >
            NextGen shortcut
          </button>
          <button
            data-testid="stats-season-shortcut"
            onClick={() => props.onSeasonShortcut?.(2)}
          >
            SZN2 shortcut
          </button>
        </div>
      );
    }
);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({ address: "0x123" })),
}));

const renderWithTransferProvider = (component: React.ReactNode) => {
  return render(<TransferProvider>{component}</TransferProvider>);
};

describe("UserPageCollected", () => {
  const useRouterMock = useRouter as jest.Mock;
  const usePathnameMock = usePathname as jest.Mock;
  const useSearchParamsMock = useSearchParams as jest.Mock;
  const useParamsMock = useParams as jest.Mock;
  const useQueryMock = useQuery as jest.Mock;

  // Reusable router mocks (Next App Router) — component uses router.replace(...)
  const routerReplace = jest.fn();
  const routerPush = jest.fn();

  const mockProfile = {
    handle: "testuser",
    wallet: "0x123",
  } as any;

  // Provide entries() so URLSearchParams(Array.from(searchParams.entries())) patterns work in code/tests
  const mockSearchParams = {
    get: jest.fn(),
    toString: jest.fn(() => ""),
    entries: jest.fn(() => [].values()),
  };
  const getLastReplaceParams = () => {
    const path = routerReplace.mock.calls.at(-1)?.[0] as string | undefined;
    const query = path?.split("?")[1] ?? "";
    return new URLSearchParams(query);
  };

  beforeEach(() => {
    useParamsMock.mockReturnValue({ user: "testuser" });
    usePathnameMock.mockReturnValue("/testuser/collected");
    useSearchParamsMock.mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue("");

    // Provide router with replace/push so component calls during mount don't crash
    useRouterMock.mockReturnValue({
      replace: routerReplace,
      push: routerPush,
    });

    useQueryMock.mockReturnValue({
      isFetching: false,
      isLoading: false,
      data: {
        data: [],
        count: 0,
        page: 1,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    routerReplace.mockReset();
    routerPush.mockReset();
  });

  it("shows loading state initially", () => {
    useQueryMock.mockReturnValue({
      isFetching: false,
      isLoading: true,
      data: undefined,
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("renders filters and cards when data loaded", () => {
    const mockData = {
      data: [
        { token_id: 1, collection: CollectedCollectionType.MEMES },
        { token_id: 2, collection: CollectedCollectionType.MEMES },
      ],
      count: 50,
      page: 1,
    };

    useQueryMock.mockReturnValue({
      isFetching: false,
      isLoading: false,
      data: mockData,
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    expect(screen.getByTestId("stats-summary")).toBeInTheDocument();
    expect(screen.getByTestId("filters")).toBeInTheDocument();
    expect(screen.getByTestId("cards")).toBeInTheDocument();
    expect(screen.getByTestId("cards")).toHaveAttribute(
      "data-cards-count",
      "2"
    );
  });

  it("handles collection filter from search params", () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "collection") return "memes";
      return null;
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    expect(screen.getByTestId("filters")).toHaveAttribute(
      "data-collection",
      "MEMES"
    );
  });

  it("handles seized filter from search params", () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "seized") return "seized";
      return null;
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);
    expect(screen.getByTestId("filters")).toBeInTheDocument();
  });

  it("handles season filter from search params", () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "collection") return "memes";
      if (key === "szn") return "1";
      return null;
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);
    expect(screen.getByTestId("filters")).toBeInTheDocument();
  });

  it("handles sorting parameters from search params", () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "sort-by") return "token_id";
      if (key === "sort-direction") return "asc";
      return null;
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);
    expect(screen.getByTestId("filters")).toBeInTheDocument();
  });

  it("handles pagination from search params", () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "page") return "2";
      return null;
    });

    const mockData = {
      data: [],
      count: 50,
      page: 2,
    };

    useQueryMock.mockReturnValue({
      isFetching: false,
      isLoading: false,
      data: mockData,
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);
    expect(screen.getByTestId("cards")).toHaveAttribute("data-page", "2");
  });

  it("shows data row for collections that support it", () => {
    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);
    expect(screen.getByTestId("cards")).toHaveAttribute(
      "data-show-data-row",
      "true"
    );
  });

  it("hides data row for collections that disable it", () => {
    mockSearchParams.get.mockImplementation((k: string) =>
      k === "collection" ? "memelab" : null
    );
    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);
    expect(screen.getByTestId("cards")).toHaveAttribute(
      "data-show-data-row",
      "false"
    );
  });

  it("calculates total pages correctly from data count", async () => {
    const mockData = {
      data: [],
      count: 50,
      page: 1,
    };

    useQueryMock.mockReturnValue({
      isFetching: false,
      isLoading: false,
      data: mockData,
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    await waitFor(() => {
      expect(screen.getByTestId("cards")).toHaveAttribute(
        "data-total-pages",
        "3"
      );
    });
  });

  it("uses profile handle when no address filter provided", () => {
    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryFn: expect.any(Function),
        queryKey: expect.arrayContaining([
          "PROFILE_COLLECTED",
          expect.objectContaining({
            handleOrWallet: "testuser",
            accountForConsolidations: true,
          }),
        ]),
      })
    );
  });

  it("uses address when address filter provided", () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "address") return "0xabc123";
      return null;
    });

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining([
          "PROFILE_COLLECTED",
          expect.objectContaining({
            handleOrWallet: "0xabc123",
            accountForConsolidations: false,
          }),
        ]),
      })
    );
  });

  it("applies collection shortcuts through the existing url filter flow", async () => {
    const user = userEvent.setup();

    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "collection") return "network";
      if (key === "sort-by") return "xtdh";
      if (key === "sort-direction") return "desc";
      return null;
    });
    mockSearchParams.toString.mockReturnValue(
      "collection=network&sort-by=xtdh&sort-direction=desc"
    );

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    await user.click(screen.getByTestId("stats-collection-shortcut"));

    const params = getLastReplaceParams();

    expect(params.get("collection")).toBe("nextgen");
    expect(params.get("page")).toBeNull();
    expect(params.get("seized")).toBeNull();
    expect(params.get("szn")).toBeNull();
    expect(params.get("subcollection")).toBeNull();
    expect(params.get("sort-by")).toBeNull();
    expect(params.get("sort-direction")).toBeNull();
  });

  it("applies season shortcuts through the existing url filter flow", async () => {
    const user = userEvent.setup();

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    await user.click(screen.getByTestId("stats-season-shortcut"));

    const params = getLastReplaceParams();

    expect(params.get("collection")).toBe("memes");
    expect(params.get("page")).toBeNull();
    expect(params.get("seized")).toBe("seized");
    expect(params.get("szn")).toBe("2");
    expect(params.get("subcollection")).toBeNull();
    expect(params.get("sort-by")).toBeNull();
    expect(params.get("sort-direction")).toBeNull();
  });

  it("clears the collection shortcut when the same metric is clicked again", async () => {
    const user = userEvent.setup();

    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "collection") return "nextgen";
      if (key === "seized") return "seized";
      return null;
    });
    mockSearchParams.toString.mockReturnValue(
      "collection=nextgen&seized=seized"
    );

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    await user.click(screen.getByTestId("stats-collection-shortcut"));

    const params = getLastReplaceParams();

    expect(params.get("collection")).toBeNull();
    expect(params.get("szn")).toBeNull();
    expect(params.get("page")).toBeNull();
    expect(routerReplace).toHaveBeenLastCalledWith("/testuser/collected", {
      scroll: false,
    });
  });

  it("clears the season shortcut when the same season is clicked again", async () => {
    const user = userEvent.setup();

    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "collection") return "memes";
      if (key === "szn") return "2";
      if (key === "seized") return "seized";
      return null;
    });
    mockSearchParams.toString.mockReturnValue(
      "collection=memes&szn=2&seized=seized"
    );

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    await user.click(screen.getByTestId("stats-season-shortcut"));

    const params = getLastReplaceParams();

    expect(params.get("collection")).toBeNull();
    expect(params.get("szn")).toBeNull();
    expect(params.get("page")).toBeNull();
    expect(routerReplace).toHaveBeenLastCalledWith("/testuser/collected", {
      scroll: false,
    });
  });

  it("uses network as a standalone canonical url without explicit default sort params", () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "collection") return "network";
      return null;
    });
    mockSearchParams.toString.mockReturnValue("collection=network");

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining([
          "XTDH_TOKENS",
          "testuser",
          1,
          24,
          "XTDH",
          "DESC",
        ]),
      })
    );
  });

  it("passes the optimistic season selection to the stats summary", async () => {
    const user = userEvent.setup();

    renderWithTransferProvider(<UserPageCollected profile={mockProfile} />);

    expect(screen.getByTestId("stats-summary")).toHaveAttribute(
      "data-active-season-number",
      ""
    );

    await user.click(screen.getByTestId("filters-set-szn"));

    await waitFor(() =>
      expect(screen.getByTestId("stats-summary")).toHaveAttribute(
        "data-active-season-number",
        "2"
      )
    );
  });
});
