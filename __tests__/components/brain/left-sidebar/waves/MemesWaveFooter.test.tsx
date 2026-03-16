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
      onClose,
      sessionId,
    }: {
      readonly isOpen: boolean;
      readonly sessionId: number;
      readonly onClose: () => void;
    }) => {
      const React = require("react");

      React.useEffect(() => {
        mockDialogMountCount += 1;

        return () => {
          mockDialogUnmountCount += 1;
        };
      }, []);

      return isOpen ? (
        <div>
          <div>Quick Vote Modal</div>
          <div>Session {sessionId}</div>
          <button type="button" onClick={onClose}>
            Close Quick Vote
          </button>
        </div>
      ) : null;
    },
  })
);

const useMemesWaveFooterStatsMock =
  useMemesWaveFooterStats as jest.MockedFunction<
    typeof useMemesWaveFooterStats
  >;
let mockDialogMountCount = 0;
let mockDialogUnmountCount = 0;

describe("MemesWaveFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDialogMountCount = 0;
    mockDialogUnmountCount = 0;
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

  it("keeps the quick-vote dialog mounted across close and reopen", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      uncastPower: 5000,
      unratedCount: 3,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter />);

    expect(mockDialogMountCount).toBe(1);
    expect(mockDialogUnmountCount).toBe(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Uncast Power, 5,000 TDH, 3 left",
      })
    );

    expect(screen.getByText("Session 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Quick Vote" }));

    expect(screen.queryByText("Quick Vote Modal")).not.toBeInTheDocument();
    expect(mockDialogMountCount).toBe(1);
    expect(mockDialogUnmountCount).toBe(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Uncast Power, 5,000 TDH, 3 left",
      })
    );

    expect(screen.getByText("Session 2")).toBeInTheDocument();
    expect(mockDialogMountCount).toBe(1);
    expect(mockDialogUnmountCount).toBe(0);
  });
});
