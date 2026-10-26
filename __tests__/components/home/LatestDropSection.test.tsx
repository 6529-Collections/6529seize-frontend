import LatestDropSection from "@/components/home/now-minting/LatestDropSection";
import { fireEvent, render, screen } from "@testing-library/react";

const mockUseLatestDropTransitionReady = jest.fn();
const mockUseNextMintDrop = jest.fn();
const mockUseNowMintingStatus = jest.fn();
const mockRefetch = jest.fn();

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

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
  default: ({
    nft,
    isFetching,
  }: {
    readonly nft?: { readonly id: number };
    readonly isFetching: boolean;
  }) => (
    <div
      data-testid="latest-drop"
      data-token-id={nft?.id}
      data-loading={!nft && isFetching}
    >
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
    mockRefetch.mockReset();
    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 536 },
      isFetching: false,
      isDropComplete: true,
      isStatusLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    mockUseNextMintDrop.mockReturnValue({
      nextMint: { id: "next-drop" },
      waveId: "main-stage-wave",
      isFetching: false,
      isLoading: false,
      isSettingsLoaded: true,
    });
    mockUseLatestDropTransitionReady.mockReturnValue(false);
  });

  it.each(["mint status", "settings", "winner"])(
    "waits to select artwork while %s is initially loading",
    (pending) => {
      mockUseNowMintingStatus.mockReturnValue({
        nft: { id: 536 },
        isFetching: false,
        isDropComplete: false,
        isStatusLoading: pending === "mint status",
      });
      mockUseNextMintDrop.mockReturnValue({
        nextMint: null,
        waveId: pending === "settings" ? null : "main-stage-wave",
        isFetching: pending === "winner",
        isLoading: pending !== "mint status",
        isSettingsLoaded: pending !== "settings",
      });

      render(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);

      expect(screen.getByTestId("latest-drop")).not.toHaveAttribute(
        "data-token-id"
      );
      expect(screen.getByTestId("latest-drop")).toHaveAttribute(
        "data-loading",
        "true"
      );
      expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
    }
  );

  it("does not select old artwork while the grace deadline is being checked", () => {
    mockUseLatestDropTransitionReady.mockReturnValue(null);
    const { rerender } = render(
      <LatestDropSection mintStatus={mockUseNowMintingStatus()} />
    );
    expect(screen.getByTestId("latest-drop")).not.toHaveAttribute(
      "data-token-id"
    );
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-loading",
      "true"
    );

    mockUseLatestDropTransitionReady.mockReturnValue(true);
    rerender(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.getByTestId("next-drop")).toHaveAttribute(
      "data-drop-id",
      "next-drop"
    );
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
  });

  it("keeps an active latest drop visible during a background refresh", () => {
    const { rerender } = render(
      <LatestDropSection mintStatus={mockUseNowMintingStatus()} />
    );
    const artwork = screen.getByTestId("latest-drop");
    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 536 },
      isFetching: true,
      isStatusLoading: false,
      isDropComplete: false,
    });
    mockUseNextMintDrop.mockReturnValue({
      nextMint: null,
      isFetching: true,
      isLoading: false,
    });
    rerender(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.getByTestId("latest-drop")).toBe(artwork);
    expect(artwork).toHaveAttribute("data-loading", "false");
  });

  it("keeps a confirmed next drop mounted while data refreshes", () => {
    mockUseLatestDropTransitionReady.mockReturnValue(true);
    const { rerender } = render(
      <LatestDropSection mintStatus={mockUseNowMintingStatus()} />
    );
    const nextDrop = screen.getByTestId("next-drop");

    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 536 },
      isFetching: true,
      isDropComplete: true,
    });
    mockUseNextMintDrop.mockReturnValue({
      nextMint: { id: "next-drop" },
      isFetching: true,
      isSettingsLoaded: true,
      waveId: "main-stage-wave",
    });
    rerender(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);

    expect(screen.getByTestId("next-drop")).toBe(nextDrop);
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
  });

  it("keeps cached artwork visible after a failed background refresh", () => {
    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 536 },
      isFetching: false,
      isDropComplete: false,
      error: new Error("offline"),
    });
    const { rerender } = render(
      <LatestDropSection mintStatus={mockUseNowMintingStatus()} />
    );
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-token-id",
      "536"
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Mounting the details can retry the failed status query. Keep the fallback
    // mounted instead of restarting the initial loading decision on every retry.
    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 536 },
      isFetching: false,
      isDropComplete: false,
      isStatusLoading: true,
    });
    rerender(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-token-id",
      "536"
    );
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-loading",
      "false"
    );
  });

  it("waits again when a different mint arrives without its status", () => {
    const { rerender } = render(
      <LatestDropSection mintStatus={mockUseNowMintingStatus()} />
    );
    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 537 },
      isFetching: false,
      isDropComplete: false,
      isStatusLoading: true,
    });
    rerender(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.getByTestId("latest-drop")).not.toHaveAttribute(
      "data-token-id"
    );
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-loading",
      "true"
    );
  });

  it("offers recovery after an initial artwork failure", () => {
    mockUseNowMintingStatus.mockReturnValue({
      nft: undefined,
      isFetching: false,
      isDropComplete: false,
      error: new Error("offline"),
      refetch: mockRefetch,
    });
    const { rerender } = render(
      <LatestDropSection mintStatus={mockUseNowMintingStatus()} />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn’t load the latest artwork"
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    mockUseNowMintingStatus.mockReturnValue({
      nft: { id: 536 },
      isFetching: false,
      isDropComplete: false,
      error: null,
    });
    rerender(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-token-id",
      "536"
    );
  });

  it("shows a skeleton only while the artwork itself is initially loading", () => {
    mockUseNowMintingStatus.mockReturnValue({
      nft: undefined,
      isFetching: true,
      isDropComplete: false,
    });
    render(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-loading",
      "true"
    );
  });

  it("keeps the latest drop during the post-mint grace period", () => {
    render(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);

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

    render(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);

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

    render(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);

    expect(screen.getByTestId("latest-drop")).toBeInTheDocument();
    expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
  });
});
