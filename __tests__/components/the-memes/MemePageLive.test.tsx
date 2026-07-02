import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import {
  MemePageLiveRightMenu,
  MemePageLiveSubMenu,
} from "@/components/the-memes/MemePageLive";
import { MemeCollectorsStats } from "@/components/the-memes/MemePageLiveStats";
import { MemePageReferencesSubMenu } from "@/components/the-memes/MemePageReferences";
import type { NFT, Rememe } from "@/entities/INFT";
import {
  ApiMemesExtendedDataTokenTypeEnum,
  type ApiMemesExtendedData,
} from "@/generated/models/ApiMemesExtendedData";
import {
  formatDate,
  formatInteger,
  formatNumber,
  formatPercent,
} from "@/i18n/format";
import { t } from "@/i18n/messages";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";

let mockCountry = "US";
let mockIsIos = false;
const mockMemePageArt = jest.fn((..._args: unknown[]) => (
  <div data-testid="meme-page-art" />
));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ unoptimized, priority, ...props }: any) =>
    createElement("img", {
      ...props,
      alt: props.alt ?? "",
      "data-unoptimized": unoptimized,
      "data-priority": priority,
    }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/the-memes/MemePageArt", () => ({
  __esModule: true,
  MemePageArt: (...args: unknown[]) => mockMemePageArt(...args),
}));
jest.mock("@/components/nft-image/RememeImage", () => ({
  __esModule: true,
  default: () => <div data-testid="rememe-image" />,
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  CookieConsentProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useCookieConsent: () => ({ country: mockCountry }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
}));

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: ({
    handleOrWallet,
  }: {
    readonly handleOrWallet?: string | null | undefined;
  }) => ({
    profile: handleOrWallet ? { handle: handleOrWallet, pfp: null } : null,
    isLoading: false,
  }),
}));

jest.mock("@/components/nft-marketplace-links/NFTMarketplaceLinks", () => ({
  __esModule: true,
  default: () => <div data-testid="marketplace-links" />,
}));

const mockFetchUrl = jest.fn();
jest.mock("@/services/6529api", () => ({
  __esModule: true,
  fetchUrl: (url: string) => mockFetchUrl(url),
}));

jest.mock("@/services/api/common-api", () => ({
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
  mockMemePageArt.mockClear();
  mockCountry = "US";
  mockIsIos = false;
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

function createMeta(): ApiMemesExtendedData {
  return {
    id: 1,
    contract: "0x1",
    created_at: new Date(),
    mint_date: new Date(),
    mint_price: 0,
    supply: 1,
    name: "Meme",
    collection: "col",
    token_type: ApiMemesExtendedDataTokenTypeEnum.Erc1155,
    description: "d",
    artist: "artist",
    artist_seize_handle: "artist",
    uri: "",
    icon: "",
    thumbnail: "",
    scaled: "",
    image: "image.png",
    animation: "",
    metadata: {},
    market_cap: 0,
    floor_price: 0,
    floor_price_from: null,
    total_volume_last_24_hours: 0,
    total_volume_last_7_days: 0,
    total_volume_last_1_month: 0,
    total_volume: 0,
    has_distribution: true,
    highest_offer: 0,
    highest_offer_from: null,
    boosted_tdh: 0,
    tdh: 0,
    tdh__raw: 0,
    tdh_rank: 0,
    hodl_rate: 0,
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
    compressed_animation: null,
    season: 1,
    meme: 1,
    meme_name: "meme",
  };
}

function createRememe(name: string, overrides: Partial<Rememe> = {}): Rememe {
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
    ...overrides,
  } as Rememe;
}

describe("MemePageReferencesSubMenu sorting", () => {
  it("loads rememes according to selected sort", async () => {
    const nft = createNft();
    const firstData = [createRememe("Random Rememe")];
    const secondData = [createRememe("Recent Rememe")];

    mockFetchUrl
      .mockResolvedValueOnce({ data: [], count: 0 }) // meme lab
      .mockResolvedValueOnce({ data: firstData, count: 21 }); // initial rememes

    render(<MemePageReferencesSubMenu show nft={nft} />);

    expect(mockFetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/nfts_memelab?sort_direction=asc&meme_id=${nft.id}`
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

    render(<MemePageReferencesSubMenu show nft={nft} />);

    await waitFor(() =>
      expect(screen.getByText(/Random1/)).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: t("en-US", "theMemes.detail.references.refresh.ariaLabel"),
      })
    );

    await waitFor(() =>
      expect(screen.getByText(/Random2/)).toBeInTheDocument()
    );
  });

  it("renders references labels and links with the active locale", async () => {
    const nft = createNft();
    const firstData = [
      createRememe("Locale Rememe", {
        contract: "0xabc",
        id: "42",
        replicas: [1, 2],
      }),
    ];

    mockFetchUrl
      .mockResolvedValueOnce({ data: [], count: 0 })
      .mockResolvedValueOnce({ data: firstData, count: 21 });

    render(<MemePageReferencesSubMenu show nft={nft} locale="de-DE" />);

    expect(
      screen.getByAltText(
        t("de-DE", "theMemes.detail.references.memeLab.logoAlt")
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        t("de-DE", "theMemes.detail.references.memeLab.description")
      )
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(
        t("de-DE", "theMemes.detail.references.rememes.logoAlt")
      )
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Locale Rememe")).toBeInTheDocument()
    );

    expect(
      screen.getByRole("button", {
        name: t("de-DE", "theMemes.detail.references.sort.trigger", {
          sort: t("de-DE", "rememes.sort.random"),
        }),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("de-DE", "theMemes.detail.references.refresh.ariaLabel"),
      })
    ).toBeInTheDocument();
    const rememeLink = screen.getByRole("link", {
      name: t("de-DE", "rememes.card.linkAriaLabel", {
        name: "Locale Rememe",
        tokenId: "42",
      }),
    });
    expect(rememeLink).toHaveAttribute(
      "href",
      "/rememes/0xabc/42?locale=de-DE"
    );
    expect(rememeLink).toHaveTextContent(
      t("de-DE", "rememes.card.replicaCount", {
        count: formatInteger("de-DE", 2),
      })
    );
  });
});

describe("MemePageLiveRightMenu distribution link", () => {
  it("preserves every artist handle when there are fewer artist names", () => {
    render(
      <MemePageLiveRightMenu
        show
        nft={createNft({
          artist: "Alice Collective",
          artist_seize_handle: "alice, bob",
        })}
      />
    );

    expect(
      screen.getByRole("link", { name: "Alice Collective" })
    ).toHaveAttribute("href", "/alice");
    expect(screen.getByRole("link", { name: "bob" })).toHaveAttribute(
      "href",
      "/bob"
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("maps ampersand-separated artist names to separate artist handles", () => {
    render(
      <MemePageLiveRightMenu
        show
        nft={createNft({
          artist: "Zar & dsoeirosanches",
          artist_seize_handle: "Zar, dsanchesGM",
        })}
      />
    );

    expect(screen.getByRole("link", { name: "Zar" })).toHaveAttribute(
      "href",
      "/Zar"
    );
    expect(
      screen.getByRole("link", { name: "dsoeirosanches" })
    ).toHaveAttribute("href", "/dsanchesGM");
  });

  it("falls back to the artist name when no artist handle exists", () => {
    render(
      <MemePageLiveRightMenu
        show
        nft={createNft({
          artist: "Unsigned Artist",
          artist_seize_handle: "",
        })}
      />
    );

    expect(screen.getByText("Unsigned Artist")).toBeInTheDocument();
    expect(screen.queryByText("not available")).not.toBeInTheDocument();
  });

  it("shows collector count alongside edition size stats", () => {
    render(
      <MemePageLiveRightMenu
        show
        nft={createNft()}
        nftMeta={{
          ...createMeta(),
          collection_size: 498,
          hodlers: 97,
          hodlers_rank: 480,
        }}
      />
    );

    expect(screen.getByText("Edition size")).toBeInTheDocument();
    const collectorsLabel = screen.getByText("Collectors");
    const exMuseumLabel = screen.getByText("ex. 6529 museum");
    expect(collectorsLabel).toBeInTheDocument();
    expect(screen.getByText("97")).toBeInTheDocument();
    expect(screen.getByText("Rank 480/498")).toHaveClass(
      "tw-text-[10px]",
      "md:tw-text-[11px]"
    );
    expect(exMuseumLabel).toBeInTheDocument();
    expect(
      exMuseumLabel.compareDocumentPosition(collectorsLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      collectorsLabel.parentElement?.parentElement?.parentElement
    ).toHaveClass("tw-flex", "tw-flex-wrap");
  });

  it("uses ranked collection size for live rank totals when provided", () => {
    render(
      <MemePageLiveRightMenu
        show
        nft={createNft()}
        nftMeta={{
          ...createMeta(),
          collection_size: 498,
          ranked_collection_size: 497,
          hodlers: 97,
          hodlers_rank: 480,
        }}
      />
    );

    expect(screen.getByText("Rank 480/497")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collectors: Rank 480/497")
    ).toBeInTheDocument();
  });

  it("shows unranked rank pills and pending TDH for memes not recorded in TDH", () => {
    render(
      <MemePageLiveRightMenu
        show
        nft={createNft({ hodl_rate: 22.65 })}
        nftMeta={{
          ...createMeta(),
          recorded_in_tdh: false,
          ranked_collection_size: 99,
          edition_size_rank: -1,
          edition_size_cleaned_rank: -1,
          hodlers_rank: -1,
        }}
      />
    );

    expect(screen.getAllByText("Unranked")).toHaveLength(3);
    expect(screen.getByLabelText("Edition size: Unranked")).toBeInTheDocument();
    expect(
      screen.getByLabelText("ex. 6529 museum: Unranked")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Collectors: Unranked")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText("22.65")).not.toBeInTheDocument();
  });

  it("formats live panel stats with the selected locale", () => {
    const nft = createNft({
      mint_date: new Date("2024-01-02T00:00:00.000Z"),
      mint_price: 1234.5,
      floor_price: 1.2345,
      market_cap: 9876.54,
      highest_offer: 2.5,
      hodl_rate: 12.345,
    });
    const nftMeta = {
      ...createMeta(),
      collection_size: 1200,
      edition_size: 1234,
      edition_size_cleaned: 1200,
      edition_size_cleaned_rank: 12,
      hodlers: 5678,
      hodlers_rank: 987,
      percent_unique: 0.1234,
      percent_unique_cleaned: 0.4567,
    };

    render(
      <MemePageLiveRightMenu show nft={nft} nftMeta={nftMeta} locale="de-DE" />
    );

    expect(
      screen.getByText(
        formatDate("de-DE", nft.mint_date, {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(formatInteger("de-DE", nftMeta.edition_size)).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(formatInteger("de-DE", nftMeta.hodlers))
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        t("de-DE", "theMemes.detail.live.rank", {
          rank: formatInteger("de-DE", nftMeta.hodlers_rank),
          total: formatInteger("de-DE", nftMeta.collection_size),
        })
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        formatNumber("de-DE", nft.market_cap, { maximumFractionDigits: 2 })
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(t("de-DE", "theMemes.detail.live.market.title"))
    ).toBeInTheDocument();
  });

  it("formats collector percentages with the selected locale", () => {
    const nftMeta = {
      ...createMeta(),
      percent_unique: 0.1234,
    };

    render(<MemeCollectorsStats nftMeta={nftMeta} locale="de-DE" />);

    const expectedPercent = formatPercent(
      "de-DE",
      nftMeta.percent_unique,
      1
    ).replace(/\s/g, " ");
    expect(
      screen.getByText(
        (content) => content.replace(/\s/g, " ") === expectedPercent
      )
    ).toBeInTheDocument();
  });

  it("shows distribution plan link", async () => {
    const nft = createNft({ id: 5, has_distribution: true });
    await waitFor(() => {
      render(
        <CookieConsentProvider>
          <MemePageLiveRightMenu show nft={nft} />
        </CookieConsentProvider>
      );
    });
    const link = screen.getByRole("link", { name: /distribution plan/i });
    expect(link).toHaveAttribute("href", `/the-memes/5/distribution`);
  });

  it("preserves locale in distribution plan links", async () => {
    const nft = createNft({ id: 5, has_distribution: true });
    await waitFor(() => {
      render(
        <CookieConsentProvider>
          <MemePageLiveRightMenu show nft={nft} locale="de-DE" />
        </CookieConsentProvider>
      );
    });

    const link = screen.getByRole("link", { name: /distribution plan/i });
    expect(link).toHaveAttribute(
      "href",
      `/the-memes/5/distribution?locale=de-DE`
    );
  });

  it("shows marketplace links outside non-US iOS", async () => {
    render(<MemePageLiveRightMenu show nft={createNft()} />);

    expect(screen.getByTestId("marketplace-links")).toBeInTheDocument();
    expect(
      screen.getByText("Mint price").parentElement?.parentElement
    ).toHaveClass("tw-flex", "tw-flex-wrap");
  });

  it("hides marketplace links for non-US iOS", async () => {
    mockCountry = "EE";
    mockIsIos = true;

    render(<MemePageLiveRightMenu show nft={createNft()} />);

    expect(screen.queryByTestId("marketplace-links")).not.toBeInTheDocument();
  });
});

describe("MemePageLiveSubMenu details", () => {
  it("renders the media type badge", () => {
    const nft = createNft({
      metadata: {
        animation_details: {
          format: "HTML",
        },
      },
    });

    render(<MemePageLiveSubMenu show nft={nft} nftMeta={createMeta()} />);

    expect(screen.getByText("Interactive - HTML")).toBeInTheDocument();
  });

  it("opens additional details when the default flag changes", async () => {
    const nft = createNft();
    const nftMeta = createMeta();

    const { rerender } = render(
      <MemePageLiveSubMenu
        show
        nft={nft}
        nftMeta={nftMeta}
        defaultAdditionalDetailsOpen={false}
      />
    );

    expect(
      screen.getByRole("button", { name: /additional details/i })
    ).toHaveAttribute("aria-expanded", "false");

    rerender(
      <MemePageLiveSubMenu
        show
        nft={nft}
        nftMeta={nftMeta}
        defaultAdditionalDetailsOpen={true}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /additional details/i })
      ).toHaveAttribute("aria-expanded", "true")
    );
  });

  it("passes locale into additional details content", () => {
    render(
      <MemePageLiveSubMenu
        show
        nft={createNft()}
        nftMeta={createMeta()}
        defaultAdditionalDetailsOpen={true}
        locale="de-DE"
      />
    );

    expect(mockMemePageArt).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "de-DE" }),
      undefined
    );
  });
});
