import { render, screen, waitFor } from "@testing-library/react";
import GradientPage from "../../../components/6529Gradient/GradientPage";
import { useRouter } from "next/router";
import { fetchUrl } from "../../../services/6529api";
import { AuthContext } from "../../../components/auth/Auth";
import { mockGradientCollection } from "../../fixtures/gradientFixtures";
import { CookieConsentProvider } from "../../../components/cookies/CookieConsentContext";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("../../../services/6529api", () => ({ fetchUrl: jest.fn() }));

jest.mock("../../../components/nft-image/NFTImage", () => (props: any) => (
  <div data-testid="image" data-owned={String(props.showOwned)} />
));
jest.mock("../../../components/address/Address", () => (props: any) => (
  <div data-testid="address">{props.display}</div>
));
jest.mock("../../../components/the-memes/ArtistProfileHandle", () => () => (
  <div data-testid="artist" />
));
jest.mock("../../../components/nftAttributes/NftStats", () => ({
  NftPageStats: () => <div data-testid="stats" />,
}));
jest.mock("../../../components/nft-navigation/NftNavigation", () => () => (
  <div data-testid="nav" />
));
jest.mock(
  "../../../components/nft-marketplace-links/NFTMarketplaceLinks",
  () => () => <div data-testid="links" />
);
jest.mock("../../../components/latest-activity/LatestActivityRow", () => () => (
  <tr data-testid="activity-row" />
));
jest.mock("../../../hooks/useCapacitor", () => () => ({ isMobile: false }));

const routerReplace = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  isReady: true,
  query: { id: "1" },
  replace: routerReplace,
});

const nft = {
  id: 1,
  contract: "0x",
  name: "Gradient1",
  owner: "0x1",
  owner_display: "Owner",
  mint_date: "2020-01-01",
  boosted_tdh: 1,
  tdh__raw: 1,
  tdh_rank: 1,
  mint_price: 1,
  floor_price: 1,
  market_cap: 1,
  highest_offer: 1,
  hodl_rate: 1,
};

const tx = {
  from_address: "0x0",
  to_address: "0x1",
  transaction: "0xabc",
  token_id: "1",
};

beforeEach(() => {
  jest.clearAllMocks();
  const collection = mockGradientCollection(3);
  collection[0].owner = "0x1";
  (fetchUrl as jest.Mock)
    .mockResolvedValueOnce({ data: collection })
    .mockResolvedValueOnce({ data: [tx] });
});

function renderPage(wallet: string = "0x1") {
  return render(
    <AuthContext.Provider
      value={{ connectedProfile: { wallets: [{ wallet }] } } as any}>
      <CookieConsentProvider>
        <GradientPage />
      </CookieConsentProvider>
    </AuthContext.Provider>
  );
}

describe("GradientPage", () => {
  it("shows NFT data and owner star", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId("image")).toHaveAttribute("data-owned", "true")
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("hides owner star for non-owner", async () => {
    renderPage("0x2");
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId("image")).toHaveAttribute("data-owned", "false")
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("shows transaction history", async () => {
    renderPage();
    const row = await screen.findByTestId("activity-row");
    expect(row).toBeInTheDocument();
  });

  it("renders navigation and rank", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(await screen.findByTestId("nav")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });
});
