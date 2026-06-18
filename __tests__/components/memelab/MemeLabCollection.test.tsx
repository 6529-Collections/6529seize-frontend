import { AuthContext } from "@/components/auth/Auth";
import MemeLabComponent from "@/components/memelab/MemeLab";
import LabCollection from "@/components/memelab/MemeLabCollection";
import { VolumeType } from "@/entities/INFT";
import { fetchAllPages } from "@/services/6529api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
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
jest.mock("@/services/6529api", () => ({ fetchAllPages: jest.fn() }));

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

function renderMemeLab(props?: ComponentProps<typeof MemeLabComponent>) {
  const componentProps = props ?? DEFAULT_MEME_LAB_PROPS;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

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
        { id: 1, metadata_collection: "Cool Collection" },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          contract: "0x",
          name: "NFT",
          artist: "artist",
          mint_date: "2024-01-01",
        },
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
});
