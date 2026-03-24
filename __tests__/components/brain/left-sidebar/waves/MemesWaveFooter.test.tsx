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
      uncastPower: 5000,
      unratedCount: 3,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter onOpenQuickVote={onOpenQuickVote} />);

    expect(screen.getByText("Uncast Power")).toBeInTheDocument();
    expect(screen.getByText("5,000 TDH")).toBeInTheDocument();
    expect(screen.getByText("3 left")).toBeInTheDocument();
  });

  it("calls onOpenQuickVote from the expanded card", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 3,
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
        name: "Uncast Power, 5,000 TDH, 3 left",
      })
    );

    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
  });

  it("prefetches quick vote from the expanded card on hover and focus", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 3,
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
      name: "Uncast Power, 5,000 TDH, 3 left",
    });

    fireEvent.mouseEnter(button);
    fireEvent.focus(button);

    expect(onPrefetchQuickVote).toHaveBeenCalledTimes(2);
  });

  it("renders the compact collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 4,
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
        name: "4 submissions left unrated in memes wave",
      })
    ).toBeInTheDocument();
  });

  it("calls onOpenQuickVote from the collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 4,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter collapsed onOpenQuickVote={onOpenQuickVote} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "4 submissions left unrated in memes wave",
      })
    );

    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
  });

  it("prefetches quick vote from the collapsed pill on hover and focus", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 4,
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
      name: "4 submissions left unrated in memes wave",
    });

    fireEvent.mouseEnter(button);
    fireEvent.focus(button);

    expect(onPrefetchQuickVote).toHaveBeenCalledTimes(2);
  });

  it("ignores expanded-card clicks when no submissions remain", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
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

    const button = screen.getByRole("button", {
      name: "Uncast Power, 5,000 TDH, 0 left",
    });

    fireEvent.mouseEnter(button);
    fireEvent.click(button);

    expect(onOpenQuickVote).not.toHaveBeenCalled();
    expect(onPrefetchQuickVote).not.toHaveBeenCalled();
  });
});
