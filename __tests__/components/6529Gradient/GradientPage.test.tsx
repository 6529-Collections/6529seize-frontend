import { render, screen, waitFor } from "@testing-library/react";
import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import { useRouter } from "next/navigation";
import { fetchUrl } from "@/services/6529api";
import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { mockGradientCollection } from "@/__tests__/fixtures/gradientFixtures";
import { TitleProvider } from "@/contexts/TitleContext";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: () => "/6529-gradient",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

jest.mock("@/components/nft-image/NFTImage", () => (props: any) => (
  <div data-testid="image" data-owned={String(props.showOwned)} />
));
jest.mock("@/components/address/Address", () => (props: any) => (
  <div data-testid="address">{props.display}</div>
));
jest.mock("@/components/the-memes/ArtistProfileHandle", () => () => (
  <div data-testid="artist" />
));
jest.mock("@/components/nftAttributes/NftStats", () => ({
  NftPageStats: () => <div data-testid="stats" />,
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
  it("shows NFT data and owner star", async () => {
    renderPage();
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId("image")).toHaveAttribute("data-owned", "true")
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("hides owner star for non-owner", async () => {
    renderPage("0x2");
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
    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId("nav")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });
});
