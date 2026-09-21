import { AuthContext } from "@/components/auth/Auth";
import MemeLabComponent from "@/components/memelab/MemeLab";
import LabCollection from "@/components/memelab/MemeLabCollection";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { VolumeType } from "@/entities/INFT";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/services/6529api", () => ({
  fetchAllPages: jest.fn(),
  fetchUrl: jest.fn(),
}));

jest.mock("@/components/nft-image/NFTImage", () => (props: any) => (
  <div data-testid={`nft-${props.nft.id}`}>{props.nft.name}</div>
));
jest.mock("@/components/lfg-slideshow/LFGSlideshow", () => ({
  LFGButton: () => <div data-testid="lfg-button" />,
}));
jest.mock("@/components/collections-dropdown/CollectionsDropdown", () => ({
  __esModule: true,
  default: () => <div data-testid="collections-dropdown" />,
}));
jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: any) => (
    <svg data-testid="icon" onClick={props.onClick} />
  ),
}));
jest.mock("@/components/nothingHereYet/NothingHereYetSummer", () => () => (
  <div data-testid="nothing" />
));
jest.mock("@/components/memelab/MemeLabSortControls", () => {
  const { VolumeType: ActualVolumeType } =
    jest.requireActual("@/entities/INFT");

  return {
    __esModule: true,
    default: ({ setVolumeType, volumeType }: any) => (
      <button
        type="button"
        data-testid="volume-type-control"
        onClick={() => setVolumeType(ActualVolumeType.DAYS_7)}
      >
        {volumeType}
      </button>
    ),
  };
});

const routerReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    replace: routerReplace,
  });
});

const collectionName = "Cool Collection";

const DEFAULT_MEME_LAB_PROPS: ComponentProps<typeof MemeLabComponent> = {
  initialSort: null,
  initialSortDirection: null,
};

type RenderLabCollectionOptions = Pick<
  ComponentProps<typeof LabCollection>,
  "initialSort" | "initialSortDirection" | "locale"
>;

function renderComponent({
  initialSort,
  initialSortDirection,
  locale,
}: RenderLabCollectionOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <LabCollection
          collectionName={collectionName}
          initialSort={initialSort}
          initialSortDirection={initialSortDirection}
          locale={locale}
        />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderMemeLab(
  props?: ComponentProps<typeof MemeLabComponent>,
  queryClient = createQueryClient()
) {
  const componentProps = props ?? DEFAULT_MEME_LAB_PROPS;

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <MemeLabComponent {...componentProps} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

function getRenderedNftIds() {
  return screen
    .getAllByTestId(/^nft-/)
    .map((element) => element.getAttribute("data-testid"));
}

describe("MemeLabCollection", () => {
  it("renders grouped collection cards as a labelled list with locale-preserving collection links", async () => {
    (fetchAllPages as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 1,
          contract: "0x",
          name: "NFT",
          artist: "artist",
          mint_date: "2024-01-01",
        },
      ])
      .mockResolvedValueOnce([
        { id: 1, metadata_collection: "Cool Collection" },
      ]);

    renderMemeLab({
      initialSort: "collections",
      initialSortDirection: null,
      locale: "de-DE",
    });

    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(2));
    const resultsList = await screen.findByRole("list", {
      name: "Meme Lab cards in Cool Collection",
    });
    expect(within(resultsList).getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "View Cool Collection collection" })
    ).toHaveAttribute(
      "href",
      "/meme-lab/collection/Cool-Collection?locale=de-DE"
    );
  });

  it("renders nft data and website links", async () => {
    (fetchAllPages as jest.Mock)
      .mockResolvedValueOnce([{ id: 1, website: "example.com", name: "meta" }])
      .mockResolvedValueOnce([
        { id: 1, contract: "0x", name: "NFT", artist: "artist" },
      ]);
    renderComponent();
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(2));
    expect(screen.getByText(collectionName)).toBeInTheDocument();
    expect(screen.getByTestId("nft-1")).toHaveTextContent("NFT");
    const resultsList = screen.getByRole("list", {
      name: "Meme Lab cards in Cool Collection",
    });
    expect(within(resultsList).getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "View NFT, Meme Lab card #1" })
    ).toHaveAttribute("href", "/meme-lab/1");
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.queryByText("#1 - NFT")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "example.com" })).toHaveAttribute(
      "href",
      "https://example.com"
    );
  });

  it("preserves locale on card links and falls back to source list labels", async () => {
    (fetchAllPages as jest.Mock)
      .mockResolvedValueOnce([{ id: 1, website: "", name: "meta" }])
      .mockResolvedValueOnce([
        { id: 1, contract: "0x", name: "NFT", artist: "artist" },
      ]);
    renderComponent({ locale: "de-DE" });
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole("list", { name: "Meme Lab cards in Cool Collection" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View NFT, Meme Lab card #1" })
    ).toHaveAttribute("href", "/meme-lab/1?locale=de-DE");
  });

  it("re-sorts by volume when the volume window changes", async () => {
    (fetchAllPages as jest.Mock)
      .mockResolvedValueOnce([
        { id: 1, website: "", name: "meta 1" },
        { id: 2, website: "", name: "meta 2" },
      ])
      .mockResolvedValueOnce([
        {
          id: 2,
          contract: "0x",
          name: "NFT Two",
          total_volume_last_24_hours: 5,
          total_volume_last_7_days: 20,
        },
        {
          id: 1,
          contract: "0x",
          name: "NFT One",
          total_volume_last_24_hours: 10,
          total_volume_last_7_days: 1,
        },
      ]);

    renderComponent({
      initialSort: "volume",
      initialSortDirection: "desc",
    });

    await waitFor(() =>
      expect(getRenderedNftIds()).toEqual(["nft-1", "nft-2"])
    );
    expect(screen.getByTestId("volume-type-control")).toHaveTextContent(
      VolumeType.HOURS_24
    );

    fireEvent.click(screen.getByTestId("volume-type-control"));

    await waitFor(() =>
      expect(getRenderedNftIds()).toEqual(["nft-2", "nft-1"])
    );
    expect(screen.getByTestId("volume-type-control")).toHaveTextContent(
      VolumeType.DAYS_7
    );
  });

  it("shows placeholder when no nfts", async () => {
    (fetchAllPages as jest.Mock).mockResolvedValueOnce([]);
    renderComponent();
    expect(fetchAllPages).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId("nothing")).toBeInTheDocument();
  });

  it("paginates age-sorted cards in pages of 40", async () => {
    (fetchUrl as jest.Mock)
      .mockResolvedValueOnce({
        count: 71,
        page: 1,
        next: "page-2",
        data: Array.from({ length: 40 }, (_, index) => ({
          id: 71 - index,
          contract: "0x",
          name: `NFT ${71 - index}`,
        })),
      })
      .mockResolvedValueOnce({
        count: 71,
        page: 2,
        next: null,
        data: Array.from({ length: 31 }, (_, index) => ({
          id: 31 - index,
          contract: "0x",
          name: `NFT ${31 - index}`,
        })),
      });

    renderMemeLab();

    expect(await screen.findByTestId("nft-71")).toBeInTheDocument();
    expect(getRenderedNftIds()).toHaveLength(40);
    expect(fetchUrl).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("page_size=40"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByTestId("nft-1")).toBeInTheDocument();
    expect(getRenderedNftIds()).toHaveLength(31);
    expect(screen.queryByTestId("nft-71")).not.toBeInTheDocument();
    expect(fetchUrl).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("page=2"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("retries an initial catalog error", async () => {
    (fetchUrl as jest.Mock)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        count: 1,
        page: 1,
        next: null,
        data: [{ id: 1, contract: "0x", name: "Recovered NFT" }],
      });

    renderMemeLab();

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("The catalog could not be loaded");
    fireEvent.click(within(error).getByRole("button", { name: "Try again" }));

    expect(await screen.findByTestId("nft-1")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Meme Lab cards" })
    ).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Page 1 of 1");
    expect(fetchUrl).toHaveBeenCalledTimes(2);
  });

  it("keeps focus on the results region and announces a pending page", async () => {
    let resolvePage: (value: unknown) => void = () => {};
    const pendingPage = new Promise((resolve) => {
      resolvePage = resolve;
    });
    (fetchUrl as jest.Mock)
      .mockResolvedValueOnce({
        count: 71,
        page: 1,
        next: "page-2",
        data: [{ id: 71, contract: "0x", name: "NFT 71" }],
      })
      .mockReturnValueOnce(pendingPage);
    renderMemeLab();

    expect(await screen.findByTestId("nft-71")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "Meme Lab cards" });
    const next = screen.getByRole("button", { name: "Next page" });
    next.focus();
    fireEvent.click(next);

    expect(results).toHaveFocus();
    expect(results).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Fetching");
    expect(screen.queryByTestId("nft-71")).not.toBeInTheDocument();

    await act(async () => {
      resolvePage({
        count: 71,
        page: 2,
        next: null,
        data: [{ id: 31, contract: "0x", name: "NFT 31" }],
      });
    });

    expect(await screen.findByTestId("nft-31")).toBeInTheDocument();
    expect(results).toHaveFocus();
    expect(results).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Page 2 of 2");
  });

  it("retries a failed page request", async () => {
    (fetchUrl as jest.Mock)
      .mockResolvedValueOnce({
        count: 71,
        page: 1,
        next: "page-2",
        data: [{ id: 71, contract: "0x", name: "NFT 71" }],
      })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        count: 71,
        page: 2,
        next: null,
        data: [{ id: 31, contract: "0x", name: "NFT 31" }],
      });

    renderMemeLab();
    expect(await screen.findByTestId("nft-71")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("The catalog could not be loaded");
    expect(
      screen.getByRole("region", { name: "Meme Lab cards" })
    ).toHaveFocus();
    fireEvent.click(within(error).getByRole("button", { name: "Try again" }));

    expect(await screen.findByTestId("nft-31")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Meme Lab cards" })
    ).toHaveFocus();
  });

  it("reuses a fresh page when navigating back to it", async () => {
    (fetchUrl as jest.Mock)
      .mockResolvedValueOnce({
        count: 71,
        page: 1,
        next: "page-2",
        data: [{ id: 71, contract: "0x", name: "NFT 71" }],
      })
      .mockResolvedValueOnce({
        count: 71,
        page: 2,
        next: null,
        data: [{ id: 31, contract: "0x", name: "NFT 31" }],
      });
    renderMemeLab();

    expect(await screen.findByTestId("nft-71")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(await screen.findByTestId("nft-31")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));

    expect(await screen.findByTestId("nft-71")).toBeInTheDocument();
    expect(fetchUrl).toHaveBeenCalledTimes(2);
  });

  it("shows the last valid page when a complete catalog shrinks", async () => {
    const nfts = Array.from({ length: 81 }, (_, index) => ({
      id: index + 1,
      contract: "0x",
      name: `NFT ${index + 1}`,
      total_volume_last_24_hours: index + 1,
    }));
    (fetchAllPages as jest.Mock).mockResolvedValueOnce(nfts);
    const queryClient = createQueryClient();

    renderMemeLab(
      { initialSort: "volume", initialSortDirection: "desc" },
      queryClient
    );

    expect(await screen.findByTestId("nft-81")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(await screen.findByTestId("nft-41")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(getRenderedNftIds()).toHaveLength(1));

    act(() => {
      queryClient.setQueryData(
        [QueryKey.NFTS, { scope: "meme-lab-catalog-complete" }],
        nfts.slice(0, 20)
      );
    });

    await waitFor(() => expect(getRenderedNftIds()).toHaveLength(20));
    expect(
      screen.queryByRole("button", { name: "Next page" })
    ).not.toBeInTheDocument();
  });
});
