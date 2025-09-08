import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemePage from "@/components/the-memes/MemePage";
import { MEME_FOCUS } from "@/components/the-memes/MemeShared";
import { AuthContext } from "@/components/auth/Auth";
import { useRouter } from "next/navigation";
import { fetchUrl } from "@/services/6529api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
  fetchAllPages: jest.fn(() => Promise.resolve([])),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({
    memes: [{ id: 1, tdh: 100 }],
    memes_ranks: [{ id: 1, rank: 1 }],
  })),
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

jest.mock("@/components/the-memes/MemePageArt", () => ({
  MemePageArt: ({ show }: any) =>
    show ? <div data-testid="art">Art</div> : null,
}));

jest.mock("@/components/the-memes/MemePageTimeline", () => ({
  MemePageTimeline: ({ show }: any) =>
    show ? <div data-testid="timeline">Timeline</div> : null,
}));

jest.mock("@/components/the-memes/MemePageMintCountdown", () => () => (
  <div data-testid="mint-countdown" />
));

jest.mock("@/components/nft-image/NFTImage", () => () => (
  <div data-testid="nft-image" />
));

jest.mock("@/components/nft-navigation/NftNavigation", () => () => (
  <div data-testid="nft-navigation" />
));

const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn().mockReturnValue(null),
};

const useSearchParamsMock = require("next/navigation").useSearchParams;
useSearchParamsMock.mockReturnValue(mockSearchParams);

(useRouter as jest.Mock).mockReturnValue({
  query: { id: "1" },
  isReady: true,
  push: mockPush,
  replace: jest.fn(),
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

  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemePage nftId="1" />
    </AuthContext.Provider>
  );
}

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("MemePage tab navigation", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams.get.mockReturnValue(null);
  });

  it.each([
    ["Live", MEME_FOCUS.LIVE, "live-right"],
    ["Your Cards", MEME_FOCUS.YOUR_CARDS, "yourcards-right"],
    ["The Art", MEME_FOCUS.THE_ART, "art"],
    ["Collectors", MEME_FOCUS.COLLECTORS, "collectors-right"],
    ["Activity", MEME_FOCUS.ACTIVITY, "activity"],
    ["Timeline", MEME_FOCUS.TIMELINE, "timeline"],
  ])(
    "selecting %s shows component and updates query",
    async (label, focus, testId) => {
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("mint-countdown")).toBeInTheDocument()
      );

      mockPush.mockClear();
      const btn = screen.getByRole("button", { name: label });
      await userEvent.click(btn);

      await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });

      if (label !== "Live") {
        expect(mockPush).toHaveBeenLastCalledWith(
          `/the-memes/1?focus=${focus}`
        );
      }
    }
  );
});

describe("MemePage search params handling", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams.get.mockClear();
  });

  it("defaults to LIVE focus when no focus param", async () => {
    mockSearchParams.get.mockReturnValue(null);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("live-right")).toBeInTheDocument();
    });
  });

  it("sets focus from valid search param", async () => {
    mockSearchParams.get.mockReturnValue(MEME_FOCUS.ACTIVITY);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("activity")).toBeInTheDocument();
    });
  });

  it("ignores invalid focus param and defaults to LIVE", async () => {
    mockSearchParams.get.mockReturnValue("invalid-focus");
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

    const artButton = screen.getByRole("button", { name: "The Art" });
    await userEvent.click(artButton);

    expect(mockPush).toHaveBeenCalledWith(`/the-memes/1?focus=${MEME_FOCUS.THE_ART}`);
  });
});

describe("MemePage API interactions", () => {
  beforeEach(() => {
    (fetchUrl as jest.Mock).mockClear();
  });

  it("fetches NFT metadata on mount", async () => {
    renderPage();
    
    expect(fetchUrl).toHaveBeenCalledWith(
      `${process.env.API_ENDPOINT}/api/memes_extended_data?id=1`
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
    
    // Should not make the second NFT call when metadata is empty
    await waitFor(() => {
      const calls = (fetchUrl as jest.Mock).mock.calls;
      const nftCalls = calls.filter(call => call[0].includes("/api/nfts?"));
      expect(nftCalls).toHaveLength(0);
    });
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
        { wallet: "0x123", ens: null, wallet_displayed: "0x123", is_primary: true },
        { wallet: "0x456", ens: null, wallet_displayed: "0x456", is_primary: false }
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
      <AuthContext.Provider value={mockAuthContext}>
        <MemePage nftId="1" />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const calls = (fetchUrl as jest.Mock).mock.calls;
      const transactionCalls = calls.filter(call => call[0].includes("/api/transactions"));
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
      <AuthContext.Provider value={mockAuthContext}>
        <MemePage nftId="1" />
      </AuthContext.Provider>
    );

    // Should not make transactions call
    await waitFor(() => {
      const calls = (fetchUrl as jest.Mock).mock.calls;
      const transactionCalls = calls.filter(call => call[0].includes("/api/transactions"));
      expect(transactionCalls).toHaveLength(0);
    });
  });
});

describe("MemePage loading states", () => {
  it("renders without crashing during loading", () => {
    (fetchUrl as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderPage();
    
    // Should render title and basic structure even while loading
    expect(screen.getByText("Memes")).toBeInTheDocument();
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
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Live" })).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe("MemePage navigation integration", () => {
  it("displays season and card information when data loads", async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText(/SZN1/)).toBeInTheDocument();
      expect(screen.getByText(/Card 1/)).toBeInTheDocument();
      expect(screen.getByText("Meme")).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
