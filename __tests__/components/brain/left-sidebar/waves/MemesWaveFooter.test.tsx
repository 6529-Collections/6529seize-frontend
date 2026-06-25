import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import MemesWaveFooter from "@/components/brain/left-sidebar/waves/MemesWaveFooter";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";

jest.mock("@/hooks/useMemesWaveFooterStats", () => ({
  useMemesWaveFooterStats: jest.fn(),
}));

const useMemesWaveFooterStatsMock =
  useMemesWaveFooterStats as jest.MockedFunction<
    typeof useMemesWaveFooterStats
  >;

describe("MemesWaveFooter", () => {
  const onOpenQuickVote = jest.fn();
  const onPrefetchQuickVote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: false,
      leftThisRoundCount: 0,
      uncastPower: null,
      unratedCount: 0,
      votingLabel: null,
      isReady: false,
    });
  });

  it("stays hidden until stats are ready", () => {
    render(<MemesWaveFooter onOpenQuickVote={onOpenQuickVote} />);

    expect(screen.queryByText("Uncast Power")).not.toBeInTheDocument();
  });

  it("renders the expanded footer card", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter onOpenQuickVote={onOpenQuickVote} />);

    expect(screen.getByText("Uncast Power")).toBeInTheDocument();
    expect(screen.getByText("5,000 TDH")).toBeInTheDocument();
    expect(screen.getByText("3 left this round")).toBeInTheDocument();
    expect(screen.getByText("12 unrated")).toBeInTheDocument();
  });

  it("renders the expanded footer as a floating mobile overlay", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    const { container } = render(
      <MemesWaveFooter floating onOpenQuickVote={onOpenQuickVote} />
    );

    const floatingLayer = container.querySelector(
      '[data-memes-wave-footer-layer="floating"]'
    );
    expect(floatingLayer).toHaveClass("tw-z-40");
    expect(floatingLayer).toHaveClass("tw-pointer-events-none");
    expect(floatingLayer).not.toHaveClass("tw-bg-black");

    const button = screen.getByRole("button", {
      name: "Uncast Power, 5,000 TDH left, 3 left this round, 12 unrated",
    });
    const floatingFrame = button.closest(
      '[data-memes-wave-footer-frame="floating"]'
    );
    expect(floatingFrame).toHaveClass("tw-pointer-events-auto");
  });

  it("reports footer availability changes", () => {
    const onAvailabilityChange = jest.fn();
    const { rerender, unmount } = render(
      <MemesWaveFooter
        onAvailabilityChange={onAvailabilityChange}
        onOpenQuickVote={onOpenQuickVote}
      />
    );

    expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);

    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });
    rerender(
      <MemesWaveFooter
        onAvailabilityChange={onAvailabilityChange}
        onOpenQuickVote={onOpenQuickVote}
      />
    );

    expect(onAvailabilityChange).toHaveBeenLastCalledWith(true);

    unmount();

    expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);
  });

  it("calls onOpenQuickVote from the expanded card", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Uncast Power, 5,000 TDH left, 3 left this round, 12 unrated",
      })
    );

    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
  });

  it("prefetches quick vote from the expanded card on hover and focus", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    const button = screen.getByRole("button", {
      name: "Uncast Power, 5,000 TDH left, 3 left this round, 12 unrated",
    });

    fireEvent.mouseEnter(button);
    fireEvent.focus(button);

    expect(onPrefetchQuickVote).toHaveBeenCalledTimes(2);
  });

  it("renders the compact collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 4,
      uncastPower: 5000,
      unratedCount: 9,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        collapsed
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    expect(screen.queryByText("Uncast Power")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "4 left this round, 9 unrated in the memes wave",
      })
    ).toBeInTheDocument();
  });

  it("calls onOpenQuickVote from the collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 4,
      uncastPower: 5000,
      unratedCount: 9,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter collapsed onOpenQuickVote={onOpenQuickVote} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "4 left this round, 9 unrated in the memes wave",
      })
    );

    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
  });

  it("prefetches quick vote from the collapsed pill on hover and focus", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 4,
      uncastPower: 5000,
      unratedCount: 9,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        collapsed
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    const button = screen.getByRole("button", {
      name: "4 left this round, 9 unrated in the memes wave",
    });

    fireEvent.mouseEnter(button);
    fireEvent.focus(button);

    expect(onPrefetchQuickVote).toHaveBeenCalledTimes(2);
  });

  it("ignores expanded-card clicks when no submissions remain", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: false,
      leftThisRoundCount: 0,
      uncastPower: 5000,
      unratedCount: 0,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
