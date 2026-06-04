import { act, render, screen } from "@testing-library/react";
import ApprovalDropVoteSummary from "@/components/waves/drops/ApprovalDropVoteSummary";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="progress"
      data-current={props.current}
      data-projected={props.projected}
      data-tooltip-label={props.tooltipLabel}
      data-compact={String(props.compact)}
      data-subtle={String(props.subtle)}
    />
  ),
}));

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger",
  () => ({
    __esModule: true,
    default: ({ drop, density }: any) => (
      <button
        type="button"
        data-density={density ?? "default"}
        aria-label={`View voters and vote log for ${drop.raters_count} ${
          drop.raters_count === 1 ? "voter" : "voters"
        }`}
      >
        {drop.raters_count} {drop.raters_count === 1 ? "voter" : "voters"}
      </button>
    ),
  })
);

const createDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "drop-1",
    rating: 5,
    realtime_rating: 9,
    rating_prediction: 6,
    raters_count: 2,
    rank: null,
    top_raters: [],
    wave: { voting_credit_type: ApiWaveCreditType.Rep },
    context_profile_context: { rating: 0 },
    ...overrides,
  }) as any;

describe("ApprovalDropVoteSummary", () => {
  it("shows approval threshold, realtime movement, needed amount, and voters", () => {
    render(
      <ApprovalDropVoteSummary
        drop={createDrop()}
        winningThreshold={8}
        variant="leaderboard"
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Needs 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    ).toBeInTheDocument();

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-current", "5");
    expect(progress).toHaveAttribute("data-projected", "9");
    expect(progress).toHaveAttribute(
      "data-tooltip-label",
      "Realtime votes given"
    );
    expect(progress).toHaveAttribute("data-compact", "true");
  });

  it("updates the approval countdown", () => {
    jest.useFakeTimers().setSystemTime(new Date(1_000_000));
    const { unmount } = render(
      <ApprovalDropVoteSummary
        drop={createDrop({
          rating: 8,
          realtime_rating: 8,
          over_threshold_since_ms: 1_000_000,
        })}
        winningThreshold={8}
        winningThresholdMinDurationMs={480_000}
        variant="chat"
      />
    );

    try {
      expect(screen.getByText("Approving in 8m")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(screen.getByText("Approving in 7m")).toBeInTheDocument();
    } finally {
      unmount();
      jest.useRealTimers();
    }
  });

  it("uses winning context as the official approved state", () => {
    render(
      <ApprovalDropVoteSummary
        drop={createDrop({
          rating: 8,
          winning_context: { place: 1, awards: [], decision_time: 123 },
        })}
        winningThreshold={8}
        winningThresholdMinDurationMs={480_000}
        variant="final"
      />
    );

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText(/Approving in/)).not.toBeInTheDocument();
  });

  it("keeps compact summaries small and hides optional voters and user vote", () => {
    render(
      <ApprovalDropVoteSummary
        drop={createDrop({ context_profile_context: { rating: 4 } })}
        winningThreshold={8}
        variant="compact"
        showVoters={false}
        showUserVote={false}
        subtle
      />
    );

    expect(screen.getByText("5")).toHaveClass("tw-text-iron-200");
    expect(
      screen.queryByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Your votes:")).not.toBeInTheDocument();
    expect(screen.getByTestId("progress")).toHaveAttribute(
      "data-subtle",
      "true"
    );
  });

  it("shows negative user votes without a doubled minus sign", () => {
    render(
      <ApprovalDropVoteSummary
        drop={createDrop({ context_profile_context: { rating: -4 } })}
        winningThreshold={8}
        variant="chat"
      />
    );

    expect(screen.getByText("Your votes:")).toBeInTheDocument();
    expect(screen.getByText("-4 Rep")).toBeInTheDocument();
  });
});
