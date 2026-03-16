import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import MemesWaveFooter from "@/components/brain/left-sidebar/waves/MemesWaveFooter";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";

jest.mock("@/hooks/useMemesWaveFooterStats", () => ({
  useMemesWaveFooterStats: jest.fn(),
}));

jest.mock(
  "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
    }: {
      readonly isOpen: boolean;
      readonly sessionId: number;
    }) => (isOpen ? <div>Quick Vote Modal</div> : null),
  })
);

const useMemesWaveFooterStatsMock =
  useMemesWaveFooterStats as jest.MockedFunction<
    typeof useMemesWaveFooterStats
  >;

describe("MemesWaveFooter", () => {
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
    render(<MemesWaveFooter />);

    expect(screen.queryByText("Uncast Power")).not.toBeInTheDocument();
  });

  it("renders the expanded footer card", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 3,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter />);

    expect(screen.getByText("Uncast Power")).toBeInTheDocument();
    expect(screen.getByText("5,000 TDH")).toBeInTheDocument();
    expect(screen.getByText("3 left")).toBeInTheDocument();
  });

  it("opens the quick-vote modal from the expanded card", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 3,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Uncast Power, 5,000 TDH, 3 left",
      })
    );

    expect(screen.getByText("Quick Vote Modal")).toBeInTheDocument();
  });

  it("renders the compact collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 4,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter collapsed />);

    expect(screen.queryByText("Uncast Power")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "4 submissions left unrated in memes wave",
      })
    ).toBeInTheDocument();
  });

  it("opens the quick-vote modal from the collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 4,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter collapsed />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "4 submissions left unrated in memes wave",
      })
    );

    expect(screen.getByText("Quick Vote Modal")).toBeInTheDocument();
  });
});
