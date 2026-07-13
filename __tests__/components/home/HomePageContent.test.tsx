import HomePageContent from "@/components/home/HomePageContent";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/components/home/hero", () => ({
  HeroHeader: () => <div>Hero</div>,
}));

jest.mock("@/components/home/newcomer/HomeNewcomerIntro", () => ({
  __esModule: true,
  default: () => <div>Newcomer intro</div>,
}));

jest.mock("@/components/home/now-minting", () => ({
  LatestDropSection: () => <div>Latest drop</div>,
}));

jest.mock("@/components/home/HomePageTextSection", () => ({
  __esModule: true,
  default: () => <div>Home page text</div>,
}));

jest.mock("@/components/home/next-mint-leading/NextMintLeadingSection", () => ({
  NextMintLeadingSection: () => <div>Next mint</div>,
}));

jest.mock("@/components/home/boosted/BoostedSection", () => ({
  BoostedSection: () => <div>Boosted drops</div>,
}));

jest.mock("@/components/home/explore-waves/ExploreWavesSection", () => ({
  ExploreWavesSection: () => <div>Explore waves</div>,
}));

const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);

describe("HomePageContent", () => {
  it.each([
    ["while authentication initializes", "initializing", false, false],
    ["while a wallet connects", "connecting", false, false],
    ["for an authenticated member", "connected", true, false],
    ["for a logged-out visitor", "disconnected", false, true],
    ["after a connection error", "error", false, true],
  ] as const)(
    "shows the newcomer intro only %s",
    (_description, connectionState, hasValidWalletAuth, expected) => {
      useSeizeConnectContextMock.mockReturnValue({
        connectionState,
        hasValidWalletAuth,
      } as ReturnType<typeof useSeizeConnectContext>);

      render(<HomePageContent />);

      const intro = screen.queryByText("Newcomer intro");
      if (expected) {
        expect(intro).toBeInTheDocument();
      } else {
        expect(intro).not.toBeInTheDocument();
      }
      expect(screen.getByText("Latest drop")).toBeInTheDocument();
    }
  );
});
