import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import { HeroHeader } from "@/components/home/hero";
import { LatestDropSection } from "@/components/home/now-minting";
import type { ReactNode } from "react";
import HomePageContent from "@/components/home/HomePageContent";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/useNowMintingStatus", () => ({
  useNowMintingStatus: jest.fn(() => ({
    nft: undefined,
    isStatusLoading: false,
  })),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/components/home/useHomepageTracking", () => ({
  useHomepageTracking: () => ({
    rootRef: { current: null },
    onClickCapture: jest.fn(),
  }),
}));

jest.mock("@/components/home/hero", () => ({
  HeroHeader: jest.fn(({ children }: { children: ReactNode }) => (
    <div>Hero{children}</div>
  )),
}));

jest.mock("@/components/home/newcomer/HomeNewcomerIntro", () => ({
  __esModule: true,
  default: () => <div>Newcomer intro</div>,
}));

jest.mock("@/components/home/newcomer/HomeWhatIs6529", () => ({
  __esModule: true,
  default: () => <div>What is 6529?</div>,
}));

jest.mock("@/components/home/now-minting", () => ({
  LatestDropSection: jest.fn(() => <div>Latest drop</div>),
}));

jest.mock("@/components/home/HomePageTextSection", () => ({
  __esModule: true,
  default: () => <div>Home page text</div>,
}));

jest.mock("@/components/home/next-mint-leading/NextMintLeadingSection", () => ({
  NextMintLeadingSection: () => <div>Next mint</div>,
}));

jest.mock("@/components/home/newcomer/HomeHowToStart", () => ({
  __esModule: true,
  default: () => <div>How to start</div>,
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
    "shows newcomer actions and explanation only %s",
    (_description, connectionState, hasValidWalletAuth, expected) => {
      useSeizeConnectContextMock.mockReturnValue({
        connectionState,
        hasValidWalletAuth,
      } as ReturnType<typeof useSeizeConnectContext>);

      render(<HomePageContent />);

      const intro = screen.queryByText("Newcomer intro");
      const explanation = screen.queryByText("What is 6529?");
      const steps = screen.queryByText("How to start");
      if (expected) {
        expect(intro).toBeInTheDocument();
        expect(explanation).toBeInTheDocument();
        expect(steps).toBeInTheDocument();
      } else {
        expect(intro).not.toBeInTheDocument();
        expect(explanation).not.toBeInTheDocument();
        expect(steps).not.toBeInTheDocument();
        expect(screen.getByText("Latest drop").previousElementSibling).toBe(
          screen.getByText("Hero")
        );
      }
      expect(screen.getByText("Explore waves")).toBeInTheDocument();
      expect(screen.queryByText("Boosted drops")).not.toBeInTheDocument();
      expect(screen.getByText("Latest drop")).toBeInTheDocument();
    }
  );
});

it("fetches mint status once for Latest Drop without coupling the static hero", () => {
  jest.clearAllMocks();
  useSeizeConnectContextMock.mockReturnValue({
    connectionState: "disconnected",
    hasValidWalletAuth: false,
  } as ReturnType<typeof useSeizeConnectContext>);
  render(<HomePageContent />);
  expect(useNowMintingStatus).toHaveBeenCalledTimes(1);
  const status = jest.mocked(useNowMintingStatus).mock.results[0]?.value;
  expect(jest.mocked(HeroHeader).mock.calls[0]?.[0]).not.toHaveProperty(
    "mintStatus"
  );
  expect(jest.mocked(LatestDropSection).mock.calls[0]?.[0].mintStatus).toBe(
    status
  );
});
