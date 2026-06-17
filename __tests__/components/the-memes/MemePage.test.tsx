import { AuthContext } from "@/components/auth/Auth";
import MemePage from "@/components/the-memes/MemePage";
import { MEME_FOCUS } from "@/components/the-memes/MemeShared";
import { fetchUrl } from "@/services/6529api";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock(
  "@heroicons/react/20/solid",
  () => ({
    ArrowLeftIcon: () => null,
  }),
  { virtual: true }
);

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
  fetchAllPages: jest.fn(() => Promise.resolve([])),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() =>
    Promise.resolve({
      memes: [{ id: 1, tdh: 100 }],
      memes_ranks: [{ id: 1, rank: 1 }],
    })
  ),
}));

jest.mock("@/components/the-memes/MemePageLive", () => ({
  MemePageLiveRightMenu: ({ show }: any) =>
    show ? <div data-testid="live-right">Live</div> : null,
  MemePageLiveSubMenu: ({ show }: any) =>
    show ? <div data-testid="live-sub">Live Sub</div> : null,
}));

jest.mock("@/components/the-memes/MemePageYourCards", () => ({
  MemePageYourCardsRightMenu: ({ show }: any) =>
    show ? <div data-testid="yourcards-right">Your Cards</div> : null,
  MemePageYourCardsSubMenu: ({ show }: any) =>
    show ? <div data-testid="yourcards-sub">Your Cards Sub</div> : null,
}));

jest.mock("@/components/the-memes/MemePageCollectors", () => ({
  MemePageCollectorsRightMenu: ({ show }: any) =>
    show ? <div data-testid="collectors-right">Collectors</div> : null,
  MemePageCollectorsSubMenu: ({ show }: any) =>
    show ? <div data-testid="collectors-sub">Collectors Sub</div> : null,
}));

jest.mock("@/components/the-memes/MemePageActivity", () => ({
  MemePageActivity: ({ show }: any) =>
    show ? <div data-testid="activity">Activity</div> : null,
}));

jest.mock("@/components/the-memes/MemePageArtViewer", () => ({
  MemePageArtViewer: ({ locale }: { readonly locale?: string }) => (
    <div data-locale={locale} data-testid="art-viewer" />
  ),
}));

jest.mock("@/components/the-memes/MemePageArt", () => ({
  MemePageArt: ({ show }: any) =>
    show ? <div data-testid="art">Art</div> : null,
}));

jest.mock("@/components/the-memes/MemePageReferences", () => ({
  MemePageReferencesSubMenu: ({ show }: any) =>
    show ? <div data-testid="references-sub">References</div> : null,
}));

jest.mock("@/components/the-memes/MemePageTimeline", () => ({
  MemePageTimeline: ({ show }: any) =>
    show ? <div data-testid="timeline">Timeline</div> : null,
}));

jest.mock("@/components/home/now-minting/NowMintingCountdown", () => {
  const MockNowMintingCountdown = () => <div data-testid="mint-countdown" />;
  MockNowMintingCountdown.displayName = "MockNowMintingCountdown";
  return MockNowMintingCountdown;
});

jest.mock("@/components/nft-image/NFTImage", () => {
  const MockNFTImage = () => <div data-testid="nft-image" />;
  MockNFTImage.displayName = "MockNFTImage";
  return MockNFTImage;
});

jest.mock("@/components/nft-navigation/NftNavigation", () => {
  const MockNftNavigation = () => <div data-testid="nft-navigation" />;
  MockNftNavigation.displayName = "MockNftNavigation";
  return MockNftNavigation;
});

const mockReplace = jest.fn(
  (url: string, _options?: { scroll?: boolean | undefined }) => {
    const parsedUrl = new URL(url, "https://example.com");
    currentFocus = parsedUrl.searchParams.get("focus");
  }
);
let currentFocus: string | null = null;
let currentLocale: string | null = null;
const mockSearchParams = {
  get: jest.fn((key: string) => {
    if (key === "focus") {
      return currentFocus;
    }
    if (key === "locale") {
      return currentLocale;
    }
    return null;
  }),
  toString: jest.fn(() => {
    const params = new URLSearchParams();
    if (currentFocus) {
      params.set("focus", currentFocus);
    }
    if (currentLocale) {
      params.set("locale", currentLocale);
    }
    return params.toString();
  }),
};

const useSearchParamsMock = require("next/navigation").useSearchParams;
useSearchParamsMock.mockReturnValue(mockSearchParams);
const usePathnameMock = require("next/navigation").usePathname;
usePathnameMock.mockReturnValue("/the-memes/1");

(useRouter as jest.Mock).mockReturnValue({
  query: { id: "1" },
  isReady: true,
  push: jest.fn(),
  replace: mockReplace,
});

beforeEach(() => {
  currentFocus = null;
  currentLocale = null;
  mockReplace.mockClear();
  mockSearchParams.get.mockClear();
  mockSearchParams.toString.mockClear();
});

const nftMeta = {
  id: 1,
  season: 1,
  collection_size: 1,
  edition_size: 1,
  edition_size_rank: 1,
  museum_holdings: 0,
  museum_holdings_rank: 1,
  edition_size_cleaned: 1,
  edition_size_cleaned_rank: 1,
  hodlers: 0,
  hodlers_rank: 1,
  percent_unique: 0,
  percent_unique_rank: 1,
  percent_unique_cleaned: 0,
  percent_unique_cleaned_rank: 1,
  burnt: 0,
  edition_size_not_burnt: 1,
  edition_size_not_burnt_rank: 1,
  percent_unique_not_burnt: 0,
  percent_unique_not_burnt_rank: 1,
  meme: 1,
  meme_name: "Meme",
};

const nft = {
  id: 1,
  contract: "0x",
  created_at: new Date(),
  mint_price: 0,
  supply: 1,
  name: "Meme",
  collection: "",
  token_type: "",
  description: "",
  artist: "",
  artist_seize_handle: "",
  uri: "",
  icon: "",
  thumbnail: "",
  scaled: "",
  image: "",
  animation: "",
  market_cap: 0,
  floor_price: 0,
  total_volume_last_24_hours: 0,
  total_volume_last_7_days: 0,
  total_volume_last_1_month: 0,
  total_volume: 0,
  boosted_tdh: 0,
  tdh: 0,
  tdh__raw: 0,
  tdh_rank: 0,
  hodl_rate: 0,
  highest_offer: 0,
  has_distribution: true,
};

(fetchUrl as jest.Mock).mockImplementation((url: string) => {
  if (url.includes("memes_extended_data")) {
    return Promise.resolve({ data: [nftMeta] });
  }
  if (url.includes("nfts")) {
    return Promise.resolve({ data: [nft] });
  }
  return Promise.resolve({ data: [] });
});

function renderPage() {
  const mockAuthContext = {
    connectedProfile: {
      id: "test-id",
      handle: "test-handle",
      normalised_handle: "test-handle",
      pfp: null,
      cic: 0,
      rep: 0,
      level: 1,
      tdh: 0,
      consolidation_key: "test-key",
      display: "Test User",
      primary_wallet: "0x123",
      banner1: null,
      banner2: null,
      classification: "PSEUDONYM" as any,
      sub_classification: null,
      wallets: [],
    },
    fetchingProfile: false,
    connectionStatus: "CONNECTED" as any,
    receivedProfileProxies: [],
    activeProfileProxy: null,
    showWaves: false,
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
    setActiveProfileProxy: jest.fn(),
    setTitle: jest.fn(),
    title: "Test Title",
  };

  const page = render(
    <AuthContext.Provider value={mockAuthContext as any}>
      <MemePage nftId="1" />
    </AuthContext.Provider>
  );

  return {
    ...page,
    rerenderPage: () =>
      page.rerender(
        <AuthContext.Provider value={mockAuthContext as any}>
          <MemePage nftId="1" />
        </AuthContext.Provider>
      ),
  };
}

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("MemePage tab navigation", () => {
  beforeEach(() => {
    currentFocus = null;
    currentLocale = null;
    mockReplace.mockClear();
  });

  it.each([
    ["Collectors", MEME_FOCUS.COLLECTORS, "collectors-sub"],
    ["History", MEME_FOCUS.ACTIVITY, "activity"],
    ["References", MEME_FOCUS.REFERENCES, "references-sub"],
  ])(
    "selecting %s shows component and updates query",
    async (label, focus, testId) => {
      const page = renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("mint-countdown")).toBeInTheDocument()
      );

      mockReplace.mockClear();
      await userEvent.click(screen.getByRole("button", { name: label }));

      expect(mockReplace).toHaveBeenLastCalledWith(
        `/the-memes/1?focus=${focus}`,
        { scroll: false }
      );

      page.rerenderPage();

      await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });
    }
  );

  it("selects the Timeline history subtab", async () => {
    const page = renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("mint-countdown")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "History" }));
    page.rerenderPage();
    await waitFor(() => {
      expect(screen.getByTestId("activity")).toBeInTheDocument();
    });

    mockReplace.mockClear();
    await userEvent.click(screen.getByRole("tab", { name: "Timeline" }));

    expect(mockReplace).toHaveBeenLastCalledWith(
      `/the-memes/1?focus=${MEME_FOCUS.TIMELINE}`,
      { scroll: false }
    );

    page.rerenderPage();

    await waitFor(() => {
      expect(screen.getByTestId("timeline")).toBeInTheDocument();
    });
  });
});

describe("MemePage search params handling", () => {
  beforeEach(() => {
    currentFocus = null;
    mockReplace.mockClear();
    mockSearchParams.get.mockClear();
  });

  it("defaults to LIVE focus when no focus param", async () => {
    currentFocus = null;
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("live-right")).toBeInTheDocument();
    });
  });

  it("keeps card navigation logic before the title while using mobile-first visual ordering", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("nft-navigation")).toBeInTheDocument();
    });

    const navigation = screen.getByTestId("nft-navigation");
    const title = screen.getByRole("heading", { name: "Card 1 - Meme" });
    const nftName = within(title).getByText("Meme");

    expect(
      navigation.compareDocumentPosition(title) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(navigation.parentElement).toHaveClass("tw-order-2", "md:tw-order-1");
    expect(navigation.parentElement?.parentElement).toHaveClass(
      "tw-justify-between",
      "md:tw-justify-start",
      "tw-items-center"
    );
    expect(title).toHaveClass("tw-flex-wrap", "md:tw-flex-nowrap");
    expect(nftName).toHaveClass(
      "tw-whitespace-normal",
      "tw-break-words",
      "md:tw-truncate"
    );
    expect(nftName).not.toHaveClass("tw-truncate");
  });

  it("uses mobile-first Tailwind ordering for the minting box and artwork", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("mint-countdown")).toBeInTheDocument();
      expect(screen.getByTestId("art-viewer")).toBeInTheDocument();
    });

    const mintCountdown = screen.getByTestId("mint-countdown");
    const artViewer = screen.getByTestId("art-viewer");
    const detailsColumn = mintCountdown.parentElement;
    const artworkColumn = artViewer.parentElement?.parentElement;
    const headerGrid = artworkColumn?.parentElement;

    expect(screen.getAllByTestId("mint-countdown")).toHaveLength(1);
    expect(headerGrid).toHaveClass("lg:tw-items-center");
    expect(headerGrid?.className).toContain(
      "lg:tw-grid-cols-[minmax(0,11fr)_minmax(0,9fr)]"
    );
    expect(detailsColumn?.className).toContain("tw-contents");
    expect(detailsColumn?.className).toContain("[&>*:first-child]:tw-order-1");
    expect(artworkColumn).toHaveClass("tw-order-2");
    expect(artworkColumn).toHaveClass("lg:tw-self-stretch");
  });

  it("passes active locale into the art viewer", async () => {
    currentLocale = "de-DE";
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("art-viewer")).toHaveAttribute(
        "data-locale",
        "de-DE"
      );
    });
  });

  it("sets focus from valid search param", async () => {
    currentFocus = MEME_FOCUS.ACTIVITY;
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("activity")).toBeInTheDocument();
    });
  });

  it("ignores invalid focus param and defaults to LIVE", async () => {
    currentFocus = "invalid-focus";
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("live-right")).toBeInTheDocument();
    });
  });

  it("updates URL when activeTab changes", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("mint-countdown")).toBeInTheDocument()
    );

    const referencesButton = screen.getByRole("button", { name: "References" });
    await userEvent.click(referencesButton);

    expect(mockReplace).toHaveBeenCalledWith(
      `/the-memes/1?focus=${MEME_FOCUS.REFERENCES}`,
      { scroll: false }
    );
  });

  it("does not replace the route when the active primary tab is activated", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("mint-countdown")).toBeInTheDocument()
    );

    const overviewButton = screen.getByRole("button", { name: "Overview" });
    expect(overviewButton).not.toBeDisabled();
    expect(overviewButton).toHaveAttribute("aria-current", "page");

    mockReplace.mockClear();
    overviewButton.focus();
    expect(overviewButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(overviewButton);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("MemePage API interactions", () => {
  beforeEach(() => {
    (fetchUrl as jest.Mock).mockClear();
  });

  it("fetches NFT metadata on mount", async () => {
    renderPage();

    expect(fetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/memes_extended_data?id=1"
    );
  });

  it("fetches NFT data after metadata loads", async () => {
    renderPage();

    await waitFor(() => {
      expect(fetchUrl).toHaveBeenCalledWith(
        expect.stringContaining("/api/nfts?id=1&contract=")
      );
    });
  });

  it("handles empty metadata response", async () => {
    (fetchUrl as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("memes_extended_data")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [nft] });
    });

    renderPage();

    await waitFor(() => {
      const calls = (fetchUrl as jest.Mock).mock.calls;
      const nftCalls = calls.filter((call) => call[0].includes("/api/nfts?"));
      expect(nftCalls).toHaveLength(1);
    });

    expect(screen.queryByTestId("nft-navigation")).not.toBeInTheDocument();
  });
});

describe("MemePage wallet integration", () => {
  beforeEach(() => {
    (fetchUrl as jest.Mock).mockClear();
  });

  it("fetches transactions for connected wallets", async () => {
    const mockProfile = {
      id: "test-id",
      handle: "test-handle",
      normalised_handle: "test-handle",
      pfp: null,
      cic: 0,
      rep: 0,
      level: 1,
      tdh: 0,
      consolidation_key: "test-key",
      display: "Test User",
      primary_wallet: "0x123",
      banner1: null,
      banner2: null,
      classification: "PSEUDONYM" as any,
      sub_classification: null,
      wallets: [
        {
          wallet: "0x123",
          ens: null,
          wallet_displayed: "0x123",
          is_primary: true,
        },
        {
          wallet: "0x456",
          ens: null,
          wallet_displayed: "0x456",
          is_primary: false,
        },
      ],
    };

    const mockAuthContext = {
      connectedProfile: mockProfile,
      fetchingProfile: false,
      connectionStatus: "CONNECTED" as any,
      receivedProfileProxies: [],
      activeProfileProxy: null,
      showWaves: false,
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
      setToast: jest.fn(),
      setActiveProfileProxy: jest.fn(),
      setTitle: jest.fn(),
      title: "Test Title",
    };

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <MemePage nftId="1" />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const calls = (fetchUrl as jest.Mock).mock.calls;
      const transactionCalls = calls.filter((call) =>
        call[0].includes("/api/transactions")
      );
      expect(transactionCalls.length).toBeGreaterThan(0);
      expect(transactionCalls[0][0]).toContain("wallet=0x123,0x456");
    });
  });

  it("clears balance when no wallets connected", async () => {
    const mockProfile = {
      id: "test-id",
      handle: "test-handle",
      normalised_handle: "test-handle",
      pfp: null,
      cic: 0,
      rep: 0,
      level: 1,
      tdh: 0,
      consolidation_key: "test-key",
      display: "Test User",
      primary_wallet: null,
      banner1: null,
      banner2: null,
      classification: "PSEUDONYM" as any,
      sub_classification: null,
      wallets: [],
    };

    const mockAuthContext = {
      connectedProfile: mockProfile,
      fetchingProfile: false,
      connectionStatus: "CONNECTED" as any,
      receivedProfileProxies: [],
      activeProfileProxy: null,
      showWaves: false,
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
      setToast: jest.fn(),
      setActiveProfileProxy: jest.fn(),
      setTitle: jest.fn(),
      title: "Test Title",
    };

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <MemePage nftId="1" />
      </AuthContext.Provider>
    );

    // Should not make transactions call
    await waitFor(() => {
      const calls = (fetchUrl as jest.Mock).mock.calls;
      const transactionCalls = calls.filter((call) =>
        call[0].includes("/api/transactions")
      );
      expect(transactionCalls).toHaveLength(0);
    });
  });
});

describe("MemePage loading states", () => {
  it("renders without crashing during loading", () => {
    (fetchUrl as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderPage();

    // Should render basic navigation structure even while loading
    const backLink = screen.getByRole("link", { name: "Back to The Memes" });
    expect(backLink).toHaveAttribute("href", "/the-memes");
    expect(backLink).not.toHaveClass("tw-uppercase");
    expect(backLink).not.toHaveClass("tw-border");
    expect(backLink).not.toHaveClass("tw-border-solid");
    expect(backLink).not.toHaveClass("hover:tw-bg-iron-900/70");
    expect(backLink).toHaveClass("hover:tw-text-iron-400");
    expect(backLink).toHaveClass("tw-text-xs", "tw-px-2", "tw-py-2");
  });

  it("shows content only after metadata and NFT load", async () => {
    // Reset the mock to return proper data
    (fetchUrl as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("memes_extended_data")) {
        return Promise.resolve({ data: [nftMeta] });
      }
      if (url.includes("nfts")) {
        return Promise.resolve({ data: [nft] });
      }
      return Promise.resolve({ data: [] });
    });

    renderPage();

    // Wait for data to load and content to render
    await waitFor(
      () => {
        const overviewButton = screen.getByRole("button", {
          name: "Overview",
        });
        expect(overviewButton).not.toBeDisabled();
        expect(overviewButton).toHaveAttribute("aria-current", "page");
      },
      { timeout: 3000 }
    );
  });
});

describe("MemePage navigation integration", () => {
  it("displays season and card information when data loads", async () => {
    renderPage();

    await waitFor(
      () => {
        expect(screen.getByText(/SZN/)).toBeInTheDocument();
        const calendarPosition = screen.getByLabelText(
          "Meme calendar position"
        );
        expect(calendarPosition).toHaveClass("tw-hidden", "md:tw-flex");
        expect(within(calendarPosition).getByText("YEAR")).toBeInTheDocument();
        expect(within(calendarPosition).getByText("EPOCH")).toBeInTheDocument();
        expect(within(calendarPosition).getAllByText("/")).toHaveLength(4);
        expect(screen.getByText(/Card 1/)).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { level: 1, name: "Card 1 - Meme" })
        ).toHaveTextContent("Meme");
        expect(screen.getByTestId("nft-navigation")).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: "Back to The Memes" })
        ).toHaveAttribute("href", "/the-memes");
        expect(
          screen.getByRole("link", { name: "View SZN 1 cards" })
        ).toHaveAttribute("href", "/the-memes?szn=1&sort=age&sort_dir=ASC");
      },
      { timeout: 5000 }
    );
  });

  it("preserves the active locale on the season link", async () => {
    currentLocale = "de-DE";

    renderPage();

    await waitFor(
      () => {
        expect(
          screen.getByRole("link", { name: "Back to The Memes" })
        ).toHaveAttribute("href", "/the-memes?locale=de-DE");
        expect(
          screen.getByRole("link", { name: "View SZN 1 cards" })
        ).toHaveAttribute(
          "href",
          "/the-memes?szn=1&sort=age&sort_dir=ASC&locale=de-DE"
        );
        expect(
          screen.getByLabelText("Meme calendar position")
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});

describe("MemePage accessibility labels", () => {
  it("marks selected primary and history tabs for assistive technology", async () => {
    const page = renderPage();

    await waitFor(() => {
      const overviewButton = screen.getByRole("button", { name: "Overview" });
      expect(overviewButton).not.toBeDisabled();
      expect(overviewButton).toHaveAttribute("aria-current", "page");
    });

    const collectorsButton = screen.getByRole("button", { name: "Collectors" });
    expect(collectorsButton).not.toBeDisabled();
    expect(collectorsButton).not.toHaveAttribute("aria-current");
    expect(collectorsButton).toHaveClass("focus-visible:tw-outline");

    await userEvent.click(screen.getByRole("button", { name: "History" }));
    page.rerenderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("tablist", { name: "Meme history sections" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Card Activity", selected: true })
      ).toBeInTheDocument();
    });
  });
});
