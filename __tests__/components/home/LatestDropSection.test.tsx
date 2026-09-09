import LatestDropSection from "@/components/home/now-minting/LatestDropSection";
import { render, screen } from "@testing-library/react";

const mockUseLatestDropTransitionReady = jest.fn();
const mockUseNextMintDrop = jest.fn();
const mockUseNowMintingStatus = jest.fn();

jest.mock("@/hooks/useNextMintDrop", () => ({
  useNextMintDrop: () => mockUseNextMintDrop(),
}));

jest.mock("@/hooks/useNowMintingStatus", () => ({
  useNowMintingStatus: () => mockUseNowMintingStatus(),
}));

jest.mock("@/components/home/now-minting/useLatestDropTransitionReady", () => ({
  useLatestDropTransitionReady: (props: unknown) =>
    mockUseLatestDropTransitionReady(props),
}));

jest.mock("@/components/home/now-minting/NowMintingSection", () => ({
  __esModule: true,
  default: ({ nft }: { readonly nft?: { readonly id: number } }) => (
    <div data-testid="latest-drop" data-token-id={nft?.id}>
      Latest Drop
    </div>
  ),
}));

jest.mock("@/components/home/now-minting/LatestDropNextMintSection", () => ({
  __esModule: true,
  default: ({ drop }: { readonly drop: { readonly id: string } }) => (
    <div data-testid="next-drop" data-drop-id={drop.id}>
      Next Drop
    </div>
  ),
}));

describe("LatestDropSection", () => {
  beforeEach(() => {
    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 536 },
      isFetching: false,
      isDropComplete: true,
      isStatusLoading: false,
    });
    mockUseNextMintDrop.mockReturnValue({
      nextMint: { id: "next-drop" },
      waveId: "main-stage-wave",
      isFetching: false,
      isSettingsLoaded: true,
    });
    mockUseLatestDropTransitionReady.mockReturnValue(false);
  });

  it("keeps the latest drop during the post-mint grace period", () => {
    render(<LatestDropSection />);

    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-token-id",
      "536"
    );
    expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
    expect(mockUseLatestDropTransitionReady).toHaveBeenCalledWith({
      isDropComplete: true,
      mintNumber: 536,
    });
  });

  it("replaces latest drop with next drop after the grace period", () => {
    mockUseLatestDropTransitionReady.mockReturnValue(true);

    render(<LatestDropSection />);

    expect(screen.getByTestId("next-drop")).toHaveAttribute(
      "data-drop-id",
      "next-drop"
    );
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
  });

  it("keeps latest drop when there is no next winner", () => {
    mockUseLatestDropTransitionReady.mockReturnValue(true);
    mockUseNextMintDrop.mockReturnValue({
      nextMint: null,
      waveId: "main-stage-wave",
      isFetching: false,
      isSettingsLoaded: true,
    });

    render(<LatestDropSection />);

    expect(screen.getByTestId("latest-drop")).toBeInTheDocument();
    expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
  });
});
