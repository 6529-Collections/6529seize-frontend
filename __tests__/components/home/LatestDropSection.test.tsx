import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import LatestDropSection from "@/components/home/now-minting/LatestDropSection";
import { renderToStaticMarkup } from "react-dom/server";
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
  default: ({ nft }: { readonly nft: { readonly id: number } }) => (
    <div data-testid="latest-drop" data-token-id={nft.id}>
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
      status: "ended",
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
        status: null,
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

      expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
      expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
    }
  );

  it("does not select old artwork while the grace deadline is being checked", () => {
    mockUseLatestDropTransitionReady.mockReturnValue(null);
    const { rerender } = render(
      <LatestDropSection mintStatus={mockUseNowMintingStatus()} />
    );
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();

    mockUseLatestDropTransitionReady.mockReturnValue(true);
    rerender(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.getByTestId("next-drop")).toHaveAttribute(
      "data-drop-id",
      "next-drop"
    );
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
  });

  it("puts the server-selected Next Drop in the initial HTML with queries pending", () => {
    mockUseNextMintDrop.mockReturnValue({ nextMint: null, isLoading: true });
    const html = renderToStaticMarkup(
      <LatestDropSection
        initialDrop={{
          kind: "next",
          mintNumber: 536,
          drop: { id: "server-winner" } as ApiDropV2View,
        }}
        mintStatus={{
          ...mockUseNowMintingStatus(),
          nft: undefined,
          isFetching: true,
          isStatusLoading: true,
        }}
      />
    );

    expect(html).toContain('data-drop-id="server-winner"');
    expect(html).toContain("Next Drop");
    expect(html).not.toContain("Latest Drop");
  });

  it("keeps the server selection when the browser starts from pre-transition cached data", () => {
    mockUseNextMintDrop.mockReturnValue({
      nextMint: null,
      isLoading: false,
      isFetchedAfterMount: false,
    });
    render(
      <LatestDropSection
        initialDrop={{
          kind: "next",
          mintNumber: 536,
          drop: { id: "server-winner" } as ApiDropV2View,
        }}
        mintStatus={{ ...mockUseNowMintingStatus(), isDropComplete: false }}
      />
    );
    expect(screen.getByTestId("next-drop")).toHaveAttribute(
      "data-drop-id",
      "server-winner"
    );
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
  });

  it.each(["latest", "next"] as const)(
    "keeps a server-selected %s card until the cached winner is refreshed",
    (kind) => {
      mockUseLatestDropTransitionReady.mockReturnValue(true);
      mockUseNextMintDrop.mockReturnValue({
        nextMint: { id: "cached-winner" },
        isFetchedAfterMount: false,
      });
      const mintStatus = mockUseNowMintingStatus();
      const initialDrop =
        kind === "latest"
          ? { kind, nft: mintStatus.nft }
          : {
              kind,
              mintNumber: 536,
              drop: { id: "server-winner" } as ApiDropV2View,
            };
      const { rerender } = render(
        <LatestDropSection initialDrop={initialDrop} mintStatus={mintStatus} />
      );
      if (kind === "latest") {
        expect(screen.getByTestId("latest-drop")).toHaveAttribute(
          "data-token-id",
          "536"
        );
        expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
      } else {
        expect(screen.getByTestId("next-drop")).toHaveAttribute(
          "data-drop-id",
          "server-winner"
        );
      }

      mockUseNextMintDrop.mockReturnValue({
        nextMint: { id: "fresh-winner" },
        isFetchedAfterMount: true,
      });
      rerender(
        <LatestDropSection initialDrop={initialDrop} mintStatus={mintStatus} />
      );
      expect(screen.getByTestId("next-drop")).toHaveAttribute(
        "data-drop-id",
        "fresh-winner"
      );
    }
  );

  it("retains the server-selected card during a failed browser refresh and advances when the latest mint changes", () => {
    const mintStatus = mockUseNowMintingStatus();
    mockUseNextMintDrop.mockReturnValue({ nextMint: null, isError: true });
    const { rerender } = render(
      <LatestDropSection
        initialDrop={{
          kind: "next",
          mintNumber: 536,
          drop: { id: "server-winner" } as ApiDropV2View,
        }}
        mintStatus={{ ...mintStatus, isStatusError: true }}
      />
    );
    expect(screen.getByTestId("next-drop")).toHaveAttribute(
      "data-drop-id",
      "server-winner"
    );
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();

    mockUseNextMintDrop.mockReturnValue({ nextMint: null, isLoading: false });
    rerender(
      <LatestDropSection
        mintStatus={{ ...mintStatus, nft: { id: 537 }, isDropComplete: false }}
      />
    );
    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-token-id",
      "537"
    );
    expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
  });

  it("shows a confirmed active mint when the grace clock has elapsed and the winner lookup fails", () => {
    mockUseLatestDropTransitionReady.mockReturnValue(true);
    mockUseNextMintDrop.mockReturnValue({
      nextMint: { id: "cached-winner" },
      isError: true,
    });
    render(
      <LatestDropSection
        mintStatus={{
          ...mockUseNowMintingStatus(),
          status: "active",
          isDropComplete: false,
        }}
      />
    );

    expect(screen.getByTestId("latest-drop")).toHaveAttribute(
      "data-token-id",
      "536"
    );
  });

  it("keeps the slot empty if the winner lookup fails after the grace period", () => {
    mockUseLatestDropTransitionReady.mockReturnValue(true);
    mockUseNextMintDrop.mockReturnValue({ nextMint: null, isError: true });
    render(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);

    expect(screen.queryByText("Latest Drop")).not.toBeInTheDocument();
    expect(screen.queryByText("Next Drop")).not.toBeInTheDocument();
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
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
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

  it("omits the slot while artwork is initially loading", () => {
    mockUseNowMintingStatus.mockReturnValue({
      nft: undefined,
      isFetching: true,
      isDropComplete: false,
    });
    render(<LatestDropSection mintStatus={mockUseNowMintingStatus()} />);
    expect(screen.queryByTestId("latest-drop")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-drop")).not.toBeInTheDocument();
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
