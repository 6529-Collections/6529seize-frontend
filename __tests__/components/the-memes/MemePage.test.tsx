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
  commonApiFetch: jest.fn(() => Promise.resolve({})),
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

const replaceMock = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  query: { id: "1" },
  isReady: true,
  push: jest.fn(),
  replace: replaceMock,
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
    replaceMock.mockClear();
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

      replaceMock.mockClear();
      const btn = screen.getByRole("button", { name: label });
      await userEvent.click(btn);

      await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });

      if (label !== "Live") {
        const pushMock = (useRouter as jest.Mock).mock.results[0].value.push;
        expect(pushMock).toHaveBeenLastCalledWith(
          `/the-memes/1?focus=${focus}`
        );
      } else {
        expect(replaceMock).not.toHaveBeenCalled();
      }
    }
  );
});
