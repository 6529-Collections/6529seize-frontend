import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemePageLiveSubMenu,
  MemePageLiveRightMenu,
} from "../components/the-memes/MemePageLive";
import { NFT, MemesExtendedData, Rememe } from "../entities/INFT";
import { CookieConsentProvider } from "../components/cookies/CookieConsentContext";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("../components/nft-image/RememeImage", () => ({
  __esModule: true,
  default: () => <div data-testid="rememe-image" />,
}));
jest.mock("../components/nftAttributes/NftStats", () => ({
  __esModule: true,
  NftPageStats: () => <tr data-testid="nft-stats" />,
}));

const mockFetchUrl = jest.fn();
jest.mock("../services/6529api", () => ({
  __esModule: true,
  fetchUrl: (url: string) => mockFetchUrl(url),
}));

jest.mock("../services/api/common-api", () => ({
  __esModule: true,
  commonApiFetch: jest.fn((opts: { endpoint: string }) => {
    if (opts.endpoint === "policies/country-check") {
      return Promise.resolve({ is_eu: false, country: "US" });
    }
    return Promise.reject(new Error("Unknown endpoint"));
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.API_ENDPOINT = "https://test.6529.io";
});

afterEach(() => {
  jest.useRealTimers();
});

function createNft(overrides: Partial<NFT> = {}): NFT {
  return {
    id: 1,
    contract: "0x1",
    created_at: new Date(),
    mint_date: new Date(),
    mint_price: 0,
    supply: 1,
    name: "Meme",
    collection: "col",
    token_type: "ERC721",
    description: "d",
    artist: "artist",
    artist_seize_handle: "artist",
    uri: "",
    icon: "",
    thumbnail: "",
    scaled: "",
    image: "image.png",
    animation: "",
    market_cap: 0,
    floor_price: 0,
    total_volume_last_24_hours: 0,
    total_volume_last_7_days: 0,
    total_volume_last_1_month: 0,
    total_volume: 0,
    has_distribution: true,
    highest_offer: 0,
    boosted_tdh: 0,
    tdh: 0,
    tdh__raw: 0,
    tdh_rank: 0,
    hodl_rate: 0,
    ...overrides,
  } as NFT;
}

function createMeta(): MemesExtendedData {
  return {
    id: 1,
    created_at: new Date(),
    collection_size: 100,
    edition_size: 100,
    edition_size_rank: 1,
    museum_holdings: 0,
    museum_holdings_rank: 1,
    edition_size_cleaned: 100,
    edition_size_cleaned_rank: 1,
    hodlers: 0,
    hodlers_rank: 1,
    percent_unique: 0,
    percent_unique_rank: 1,
    percent_unique_cleaned: 0,
    percent_unique_cleaned_rank: 1,
    burnt: 0,
    edition_size_not_burnt: 100,
    edition_size_not_burnt_rank: 1,
    percent_unique_not_burnt: 0,
    percent_unique_not_burnt_rank: 1,
    season: 1,
    meme: 1,
    meme_name: "meme",
  } as MemesExtendedData;
}

function createRememe(name: string): Rememe {
  return {
    created_at: new Date(),
    updated_at: new Date(),
    contract: "0x1",
    id: "1",
    deployer: "d",
    token_uri: "u",
    token_type: "ERC721",
    image: "i",
    animation: "",
    meme_references: [],
    metadata: { name },
    contract_opensea_data: {
      imageUrl: "img",
      discordUrl: "",
      externalUrl: "",
      collectionName: "collection",
      twitterUsername: "",
    },
    media: [],
    s3_image_original: "",
    s3_image_scaled: "",
    s3_image_thumbnail: "",
    s3_image_icon: "",
    replicas: [],
    source: "",
    added_by: "",
  } as Rememe;
}

describe("MemePageLiveSubMenu sorting", () => {
  it("loads rememes according to selected sort", async () => {
    const nft = createNft();
    const firstData = [createRememe("Random Rememe")];
    const secondData = [createRememe("Recent Rememe")];

    mockFetchUrl
      .mockResolvedValueOnce({ data: [], count: 0 }) // meme lab
      .mockResolvedValueOnce({ data: firstData, count: 21 }); // initial rememes

    render(<MemePageLiveSubMenu show nft={nft} />);

    expect(mockFetchUrl).toHaveBeenCalledWith(
      `https://test.6529.io/api/nfts_memelab?sort_direction=asc&meme_id=${nft.id}`
    );
    await waitFor(() =>
      expect(screen.getByText("Random Rememe")).toBeInTheDocument()
    );

    mockFetchUrl.mockResolvedValueOnce({ data: secondData, count: 21 });
    await userEvent.click(screen.getByRole("button", { name: /sort/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /Recently Added/i })
    );

    await waitFor(() =>
      expect(mockFetchUrl).toHaveBeenLastCalledWith(
        expect.stringContaining("sort=created_at")
      )
    );
    await waitFor(() =>
      expect(screen.getByText("Recent Rememe")).toBeInTheDocument()
    );
  });

  it("refreshes results on refresh icon click", async () => {
    const nft = createNft();
    const firstData = [createRememe("Random1")];
    const refreshed = [createRememe("Random2")];

    mockFetchUrl
      .mockResolvedValueOnce({ data: [], count: 0 })
      .mockResolvedValueOnce({ data: firstData, count: 21 })
      .mockResolvedValueOnce({ data: refreshed, count: 21 });

    const { container } = render(<MemePageLiveSubMenu show nft={nft} />);

    await waitFor(() =>
      expect(screen.getByText(/Random1/)).toBeInTheDocument()
    );

    const refreshIcon = container.querySelector(
      'svg[data-icon="arrows-rotate"]'
    ) as Element;
    expect(refreshIcon).toBeInTheDocument();
    fireEvent.click(refreshIcon);

    await waitFor(() =>
      expect(screen.getByText(/Random2/)).toBeInTheDocument()
    );
  });
});

describe("MemePageLiveRightMenu distribution link", () => {
  it("shows distribution plan link", async () => {
    const nft = createNft({ id: 5, has_distribution: true });
    const meta = createMeta();
    await waitFor(() => {
      render(
        <CookieConsentProvider>
          <MemePageLiveRightMenu show nft={nft} nftMeta={meta} nftBalance={0} />
        </CookieConsentProvider>
      );
    });
    const link = screen.getByRole("link", { name: /distribution plan/i });
    expect(link).toHaveAttribute("href", `/the-memes/5/distribution`);
  });
});
