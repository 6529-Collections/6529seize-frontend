import { AuthContext } from "@/components/auth/Auth";
import LabCollection from "@/components/memelab/MemeLabCollection";
import { VolumeType } from "@/entities/INFT";
import { fetchAllPages } from "@/services/6529api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/services/6529api", () => ({ fetchAllPages: jest.fn() }));

jest.mock("@/components/nft-image/NFTImage", () => (props: any) => (
  <div data-testid={`nft-${props.nft.id}`}>{props.nft.name}</div>
));
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

function renderComponent({
  initialSort,
  initialSortDirection,
}: {
  readonly initialSort?: string | undefined;
  readonly initialSortDirection?: string | undefined;
} = {}) {
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
        />
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
});
