import { render, screen, waitFor } from "@testing-library/react";
import LabPage from "../../../components/memelab/MemeLabPage";
import { MEME_FOCUS } from "../../../components/the-memes/MemeShared";
import userEvent from "@testing-library/user-event";


// Mock TitleContext
jest.mock('../../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
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

jest.mock("../../../components/nothingHereYet/NothingHereYetSummer", () => ({ __esModule: true, default: () => <div data-testid="NothingHereYet" /> }));
jest.mock("../../../components/nftAttributes/NFTAttributes", () => ({ __esModule: true, default: () => <div data-testid="NFTAttributes" /> }));
jest.mock("../../../components/nftAttributes/NftStats", () => ({ __esModule: true, NftPageStats: () => <tr data-testid="NftStats" /> }));
jest.mock("../../../components/rememes/RememePage", () => ({ printMemeReferences: jest.fn(() => <div data-testid="MemeRefs" />) }));
jest.mock("../../../components/nft-marketplace-links/NFTMarketplaceLinks", () => ({ __esModule: true, default: () => <div data-testid="MarketLinks" /> }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
jest.mock("next/image", () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock("../../../components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: 'US',
    consent: jest.fn(),
    reject: jest.fn()
  }))
}));

const { useRouter } = require("next/router");
const { fetchUrl, fetchAllPages } = require("../../../services/6529api");
jest.mock("next/router");
jest.mock("../../../services/6529api");

beforeEach(() => {
  jest.clearAllMocks();
  process.env.API_ENDPOINT = "http://api";
  (useRouter as jest.Mock).mockReturnValue({ isReady: true, query: { id: "1" }, replace: jest.fn() });
});

function mockNftCalls(balance: number) {
  const meta = { data: [{ id: 1, metadata_collection: "col", website: "", meme_references: [], edition_size: 1, edition_size_rank: 1, collection_size: 1, museum_holdings: 0, museum_holdings_rank: 1, edition_size_cleaned: 1, edition_size_cleaned_rank: 1, hodlers: 1, hodlers_rank: 1, percent_unique: 0, percent_unique_rank: 1, percent_unique_cleaned: 0, percent_unique_cleaned_rank: 1, burnt: 0, edition_size_not_burnt: 1, edition_size_not_burnt_rank: 1, percent_unique_not_burnt: 0, percent_unique_not_burnt_rank: 1, name: "meta", created_at: new Date() }] };
  const nft = { data: [{ id: 1, contract: "0x1", meme_references: [], artist: "artist", mint_date: new Date(), name: "NFT", image: "img", animation: "", token_type: "ERC721", description: "d", supply: 1, created_at: new Date(), mint_price: 0, collection: "col", artist_seize_handle: "artist", uri: "", icon: "", thumbnail: "", scaled: "", market_cap: 0, floor_price: 0, total_volume_last_24_hours: 0, total_volume_last_7_days: 0, total_volume_last_1_month: 0, total_volume: 0, has_distribution: true, highest_offer: 0 }] };
  const tx = { data: [{ created_at: new Date(), transaction: "t", block: 0, transaction_date: new Date(), from_address: "0x0000000000000000000000000000000000000000", from_display: undefined, to_address: "0xabc", to_display: undefined, contract: "0x1", token_id: 1, token_count: balance, value: 0, royalties: 0, gas_gwei: 0, gas_price: 0, gas_price_gwei: 0, gas: 0 }] };
  const activity = { data: [], count: 0 };
  (fetchUrl as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("lab_extended_data")) return Promise.resolve(meta);
    if (url.includes("nfts_memelab")) return Promise.resolve(nft);
    if (url.includes("wallet=")) return Promise.resolve(tx);
    if (url.includes("page_size")) return Promise.resolve(activity);
    return Promise.resolve({ data: [] });
  });
  (fetchAllPages as jest.Mock).mockResolvedValue([]);
}

describe("MemeLabPage", () => {
  it("shows edition balance", async () => {
    mockNftCalls(1);
    render(<LabPage wallets={["0xabc"]} />);
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenCalledWith(
        "http://api/api/lab_extended_data?id=1"
      )
    );
    await waitFor(() =>
      expect(screen.getByText(/You Own 1 edition/i)).toBeInTheDocument()
    );
  });

  it("shows transaction history on your cards tab", async () => {
    (useRouter as jest.Mock).mockReturnValue({ isReady: true, query: { id: "1", focus: MEME_FOCUS.YOUR_CARDS }, replace: jest.fn() });
    mockNftCalls(2);
    render(<LabPage wallets={["0xabc"]} />);
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenCalledWith(
        expect.stringContaining("transactions_memelab?wallet=")
      )
    );
    await waitFor(() =>
      expect(screen.getByText(/Your Transaction History/i)).toBeInTheDocument()
    );
  });
});
