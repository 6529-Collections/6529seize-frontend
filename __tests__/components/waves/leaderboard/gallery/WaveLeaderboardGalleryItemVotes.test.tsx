import React from "react";
import { render, screen } from "@testing-library/react";
import WaveLeaderboardGalleryItemVotes from "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItemVotes";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="progress"
      data-current={props.current}
      data-projected={props.projected}
      data-subtle={props.subtle}
      data-tooltip-label={props.tooltipLabel}
    />
  ),
}));

const createApprovalDrop = (overrides: Record<string, unknown>): any => ({
  wave: { voting_credit_type: ApiWaveCreditType.Tdh },
  ...overrides,
});

describe("WaveLeaderboardGalleryItemVotes", () => {
  it("uses bright colors for default variant", () => {
    const drop: any = { rating: 5, rating_prediction: 6 };
    render(<WaveLeaderboardGalleryItemVotes drop={drop} />);
    expect(screen.getByText("5")).toHaveClass("tw-text-emerald-500");
    expect(screen.queryByText("/")).toBeNull();
    const progress = screen.getByTestId("progress");
    expect(progress.getAttribute("data-current")).toBe("5");
    expect(progress.getAttribute("data-projected")).toBe("6");
    expect(progress.getAttribute("data-subtle")).toBe("false");
  });

  it("uses subtle coloring when variant is subtle and rating negative", () => {
    const drop: any = { rating: -2, rating_prediction: -1 };
    render(<WaveLeaderboardGalleryItemVotes drop={drop} variant="subtle" />);
    expect(screen.getByText("-2")).toHaveClass("tw-text-iron-200");
    expect(screen.getByTestId("progress").getAttribute("data-subtle")).toBe(
      "true"
    );
  });

  it("shows the needed amount below the approve threshold", () => {
    const drop = createApprovalDrop({
      rating: 5,
      realtime_rating: 9,
      rating_prediction: 6,
    });
    render(
      <WaveLeaderboardGalleryItemVotes drop={drop} winningThreshold={8} />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Needs 3")).toBeInTheDocument();
    const progress = screen.getByTestId("progress");
    expect(progress.getAttribute("data-current")).toBe("5");
    expect(progress.getAttribute("data-projected")).toBe("9");
    expect(progress.getAttribute("data-tooltip-label")).toBe(
      "Votes given now"
    );
  });

  it("uses lower realtime votes for approve movement", () => {
    const drop = createApprovalDrop({
      rating: 5,
      realtime_rating: 3,
      rating_prediction: 6,
    });
    render(
      <WaveLeaderboardGalleryItemVotes drop={drop} winningThreshold={8} />
    );

    const progress = screen.getByTestId("progress");
    expect(progress.getAttribute("data-current")).toBe("5");
    expect(progress.getAttribute("data-projected")).toBe("3");
  });

  it("shows when the approve threshold is reached", () => {
    const drop = createApprovalDrop({ rating: 8, rating_prediction: 8 });
    render(
      <WaveLeaderboardGalleryItemVotes drop={drop} winningThreshold={8} />
    );
    expect(screen.getByText("Reached threshold")).toBeInTheDocument();
  });

  it("shows the approval countdown label", () => {
    jest.useFakeTimers().setSystemTime(new Date(1_000_000));
    const drop = createApprovalDrop({
      rating: 8,
      rating_prediction: 8,
      over_threshold_since_ms: 1_000_000,
    });
    const { unmount } = render(
      <WaveLeaderboardGalleryItemVotes
        drop={drop}
        winningThreshold={8}
        winningThresholdMinDurationMs={480_000}
      />
    );

    try {
      expect(screen.getByText("Approving in 8m")).toBeInTheDocument();
    } finally {
      unmount();
      jest.useRealTimers();
    }
  });

  it("shows approved when the drop has winning context", () => {
    const drop = createApprovalDrop({
      rating: 6,
      rating_prediction: 6,
      winning_context: { decision_time: 123, place: 1 },
      over_threshold_since_ms: 1_000_000,
    });
    render(
      <WaveLeaderboardGalleryItemVotes
        drop={drop}
        winningThreshold={8}
        winningThresholdMinDurationMs={480_000}
      />
    );
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText(/Approving in/)).not.toBeInTheDocument();
  });

  it("shows closed when approval voting is closed and the drop is not approved", () => {
    const drop = createApprovalDrop({ rating: 6, rating_prediction: 6 });
    render(
      <WaveLeaderboardGalleryItemVotes
        drop={drop}
        winningThreshold={8}
        isVotingClosed={true}
      />
    );
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});
