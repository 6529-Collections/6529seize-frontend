import { mockGradientCollection } from "@/__tests__/fixtures/gradientFixtures";
import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import { AuthContext } from "@/components/auth/Auth";
import { SeizeConnectProvider } from "@/components/auth/SeizeConnectContext";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { GRADIENT_CONTRACT } from "@/constants/constants";
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

jest.mock("@/components/the-memes/MemePageArtViewer", () => ({
  MemePageArtViewer: () => <div data-testid="art-viewer" />,
}));
jest.mock("@/components/address/Address", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="address">{props.display}</div>,
}));
jest.mock("@/components/the-memes/ArtistProfileHandle", () => ({
  __esModule: true,
  default: () => <div data-testid="artist" />,
}));
jest.mock("@/components/you-own-nft-badge/YouOwnNftBadge", () => ({
  __esModule: true,
  default: () => <div data-testid="owner-badge" />,
}));
jest.mock("@/components/nft-navigation/NftNavigation", () => ({
  __esModule: true,
  default: () => <div data-testid="nav" />,
}));
jest.mock("@/components/nft-marketplace-links/NFTMarketplaceLinks", () => ({
  __esModule: true,
  default: () => <div data-testid="links" />,
}));
jest.mock("@/components/latest-activity/LatestActivityRow", () => ({
  __esModule: true,
  default: (props: any) => (
    <tr
      data-testid="activity-row"
      data-variant={props.variant}
      data-row-style={props.rowStyle}
    />
  ),
}));
jest.mock("@/components/nft-transfer/TransferSingle", () => ({
  __esModule: true,
  default: () => <div data-testid="transfer-action" />,
}));
jest.mock("@/hooks/useCapacitor", () => () => ({ isIos: false }));

let mockConnectedAddress: string | undefined;

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    isAuthenticated: false,
    seizeConnect: jest.fn(),
    seizeAcceptConnection: jest.fn(),
    address: mockConnectedAddress,
    hasInitializationError: false,
    initializationError: null,
  })),
  SeizeConnectProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

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

type MockGradientCollection = ReturnType<typeof mockGradientCollection>;
type MockGradientTransaction = typeof tx;

function mockGradientFetches({
  collection = mockGradientCollection(3),
  transactions = [tx],
}: {
  readonly collection?: MockGradientCollection;
  readonly transactions?: MockGradientTransaction[];
} = {}) {
  (fetchUrl as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/nfts/gradients")) {
      return Promise.resolve({ data: collection });
    }
    if (url.includes("/api/transactions")) {
      return Promise.resolve({ data: transactions });
    }
    return Promise.resolve({ data: [] });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockConnectedAddress = undefined;
  const collection = mockGradientCollection(3);
  if (collection[0]) {
    collection[0].owner = "0x1";
    collection[0].owner_display = "TestOwner";
    collection[0].tdh__raw = 50;
  }
  mockGradientFetches({ collection });
});

function renderPage({
  wallet = "0x1",
  connectedAddress = wallet,
}: {
  readonly wallet?: string;
  readonly connectedAddress?: string | undefined;
} = {}) {
  mockConnectedAddress = connectedAddress;

  return render(
    <TitleProvider>
      <AuthContext.Provider
        value={{ connectedProfile: { wallets: [{ wallet }] } } as any}
      >
        <CookieConsentProvider>
          <SeizeConnectProvider>
            <GradientPageComponent id="1" />
          </SeizeConnectProvider>
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
      expect(screen.getByTestId("art-viewer")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByTestId("owner-badge")).toBeInTheDocument()
    );
    expect(screen.getByTestId("transfer-action")).toBeInTheDocument();
  });

  it("hides owner badge for non-owner", async () => {
    renderPage({ wallet: "0x2" });
    await waitFor(() =>
      expect(screen.getByTestId("art-viewer")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.queryByTestId("owner-badge")).not.toBeInTheDocument()
    );
    expect(screen.queryByTestId("transfer-action")).not.toBeInTheDocument();
  });

  it("shows transaction history", async () => {
    renderPage();
    const row = await screen.findByTestId("activity-row");
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute("data-variant", "tailwind");
    expect(row).toHaveAttribute("data-row-style", "striped");
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
      "https://api.test.6529.io/api/nfts/gradients?&page_size=101",
      expect.objectContaining({ signal: expect.any(Object) })
    );
    expect(fetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/transactions?contract=${GRADIENT_CONTRACT}&id=1`,
      expect.objectContaining({ signal: expect.any(Object) })
    );
  });

  it("displays NFT title correctly", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear, which indicates data has loaded
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(
      screen.getByRole("heading", { name: "Gradient 1 - Gradient #1" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "6529 Gradient" })).toHaveAttribute(
      "href",
      "/6529-gradient"
    );
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

    expect(screen.getByText("Card Details")).toBeInTheDocument();
    expect(screen.getByText("Mint Date")).toBeInTheDocument();
    expect(screen.getByText("Artist")).toBeInTheDocument();
    expect(screen.getByTestId("artist")).toBeInTheDocument();
    expect(screen.getByText("Market Overview")).toBeInTheDocument();
    expect(screen.getByText("Floor Price")).toBeInTheDocument();
    expect(screen.getByText("Market Cap")).toBeInTheDocument();
    expect(screen.getByText("Highest Offer")).toBeInTheDocument();
  });

  it("displays TDH information", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    // Wait for the NFT name to appear
    await waitFor(() =>
      expect(screen.getByText("Gradient #1")).toBeInTheDocument()
    );

    expect(screen.getAllByText("TDH")).toHaveLength(2); // heading and metric label
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

    expect(screen.getByText("Card Activity")).toBeInTheDocument();
    expect(screen.getByTestId("activity-row")).toBeInTheDocument();
  });

  it("shows transfer action only for the connected owner address", async () => {
    renderPage({ wallet: "0x1", connectedAddress: "0x2" });
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId("owner-badge")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("transfer-action")).not.toBeInTheDocument();
  });

  it("handles loading state correctly", () => {
    renderPage();

    // Initially, before NFT data is loaded, navigation should not show rank
    expect(screen.queryByText("1/3")).not.toBeInTheDocument();
  });

  it("handles empty transaction history", async () => {
    jest.clearAllMocks();
    const collection = mockGradientCollection(3);
    if (collection[0]) {
      collection[0].owner = "0x1";
    }
    mockGradientFetches({ collection, transactions: [] });

    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));

    // Transaction History section should not be rendered when no transactions
    expect(screen.queryByText("Card Activity")).not.toBeInTheDocument();
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
      expect(screen.getByTestId("art-viewer")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.queryByTestId("owner-badge")).not.toBeInTheDocument()
    );

    // Rerender with connected profile
    rerender(
      <TitleProvider>
        <AuthContext.Provider
          value={{ connectedProfile: { wallets: [{ wallet: "0x1" }] } } as any}
        >
          <CookieConsentProvider>
            <GradientPageComponent id="1" />
          </CookieConsentProvider>
        </AuthContext.Provider>
      </TitleProvider>
    );

    // Should now show as owner
    await waitFor(() =>
      expect(screen.getByTestId("art-viewer")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByTestId("owner-badge")).toBeInTheDocument()
    );
  });
});
