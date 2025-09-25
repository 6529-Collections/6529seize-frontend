import { mockGradientCollection } from "@/__tests__/fixtures/gradientFixtures";
import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { GRADIENT_CONTRACT } from "@/constants";
import { TitleProvider } from "@/contexts/TitleContext";
import { fetchUrl } from "@/services/6529api";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: () => "/6529-gradient",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

jest.mock("@/components/nft-image/NFTImage", () => (props: any) => (
  <div data-testid="image" />
));
jest.mock("@/components/address/Address", () => (props: any) => (
  <div data-testid="address">{props.display}</div>
));
jest.mock("@/components/the-memes/ArtistProfileHandle", () => () => (
  <div data-testid="artist" />
));
jest.mock("@/components/you-own-nft-badge/YouOwnNftBadge", () => () => (
  <div data-testid="owner-badge" />
));
jest.mock("@/components/nftAttributes/NftStats", () => ({
  NftPageStats: () => (
    <>
      <tr data-testid="stats-row">
        <td>Test Stat</td>
        <td>Test Value</td>
      </tr>
    </>
  ),
}));
jest.mock("@/components/nft-navigation/NftNavigation", () => () => (
  <div data-testid="nav" />
));
jest.mock(
  "@/components/nft-marketplace-links/NFTMarketplaceLinks",
  () => () => <div data-testid="links" />
);
jest.mock("@/components/latest-activity/LatestActivityRow", () => () => (
  <tr data-testid="activity-row" />
));
jest.mock("@/hooks/useCapacitor", () => () => ({ isIos: false }));

const routerReplace = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  replace: routerReplace,
});

// Import the constant for testing

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
  collection[0].owner_display = "TestOwner";
  collection[0].tdh__raw = 50;
  (fetchUrl as jest.Mock)
    .mockResolvedValueOnce({ data: collection }) // for all NFTs
    .mockResolvedValueOnce({ data: [tx] }); // for transactions
});

function renderPage(wallet: string = "0x1") {
  return render(
    <TitleProvider>
      <AuthContext.Provider
        value={{ connectedProfile: { wallets: [{ wallet }] } } as any}>
        <CookieConsentProvider>
          <GradientPageComponent id="1" />
        </CookieConsentProvider>
      </AuthContext.Provider>
    </TitleProvider>
  );
}

describe("GradientPage", () => {
  it("shows NFT data and owner badge", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId("image")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByTestId("owner-badge")).toBeInTheDocument()
    );
  });

  it("hides owner badge for non-owner", async () => {
    renderPage("0x2");
    await waitFor(() =>
      expect(screen.getByTestId("image")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.queryByTestId("owner-badge")).not.toBeInTheDocument()
    );
  });

  it("shows transaction history", async () => {
    renderPage();
    const row = await screen.findByTestId("activity-row");
    expect(row).toBeInTheDocument();
  });

  it("renders navigation and rank", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId("nav")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("fetches correct NFT data on mount", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));

    expect(fetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/nfts/gradients?&page_size=101"
    );
    expect(fetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/transactions?contract=${GRADIENT_CONTRACT}&id=1`
    );
  });

  it("displays NFT title correctly", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear, which indicates data has loaded
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(screen.getByText("6529")).toBeInTheDocument();
    expect(screen.getByText("Gradient")).toBeInTheDocument();
  });

  it("displays owner information", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear, indicating the component has rendered with data
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByTestId("address")).toBeInTheDocument();
    expect(screen.getByTestId("address")).toHaveTextContent("TestOwner");
  });

  it("displays NFT metadata", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(screen.getByText("NFT")).toBeInTheDocument();
    expect(screen.getByText("Mint Date")).toBeInTheDocument();
    expect(screen.getByText("Artist")).toBeInTheDocument();
    expect(screen.getByTestId("artist")).toBeInTheDocument();
    expect(screen.getByTestId("stats-row")).toBeInTheDocument();
  });

  it("displays TDH information", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(screen.getAllByText("TDH")).toHaveLength(2); // h3 heading and table cell
    expect(screen.getByText("100")).toBeInTheDocument(); // boosted_tdh
    expect(screen.getByText("Unweighted TDH")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument(); // tdh__raw
    expect(screen.getByText("Gradient Rank")).toBeInTheDocument();
  });

  it("displays marketplace links", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(screen.getByTestId("links")).toBeInTheDocument();
  });

  it("shows transaction history section", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(screen.getByText("Transaction History")).toBeInTheDocument();
    expect(screen.getByTestId("activity-row")).toBeInTheDocument();
  });

  it("handles loading state correctly", () => {
    renderPage();

    // Initially, before NFT data is loaded, navigation should not show rank
    expect(screen.queryByText("1/3")).not.toBeInTheDocument();
  });

  it("handles empty transaction history", async () => {
    jest.clearAllMocks();
    const collection = mockGradientCollection(3);
    collection[0].owner = "0x1";
    (fetchUrl as jest.Mock)
      .mockResolvedValueOnce({ data: collection })
      .mockResolvedValueOnce({ data: [] }); // empty transactions

    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));

    // Transaction History section should not be rendered when no transactions
    expect(screen.queryByText("Transaction History")).not.toBeInTheDocument();
    expect(screen.queryByTestId("activity-row")).not.toBeInTheDocument();
  });

  it("handles wallet connection state changes", async () => {
    const { rerender } = render(
      <TitleProvider>
        <AuthContext.Provider value={{ connectedProfile: null } as any}>
          <CookieConsentProvider>
            <GradientPageComponent id="1" />
          </CookieConsentProvider>
        </AuthContext.Provider>
      </TitleProvider>
    );

    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));

    // Should show as non-owner when no connected profile
    await waitFor(() =>
      expect(screen.getByTestId("image")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.queryByTestId("owner-badge")).not.toBeInTheDocument()
    );

    // Rerender with connected profile
    rerender(
      <TitleProvider>
        <AuthContext.Provider
          value={{ connectedProfile: { wallets: [{ wallet: "0x1" }] } } as any}>
          <CookieConsentProvider>
            <GradientPageComponent id="1" />
          </CookieConsentProvider>
        </AuthContext.Provider>
      </TitleProvider>
    );

    // Should now show as owner
    await waitFor(() =>
      expect(screen.getByTestId("image")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByTestId("owner-badge")).toBeInTheDocument()
    );
  });
});
