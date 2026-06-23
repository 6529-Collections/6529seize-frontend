import { act, render, screen } from "@testing-library/react";
import ParticipationDropRatingsTotalSection from "@/components/waves/drops/participation/ratings/ParticipationDropRatingsTotalSection";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

jest.mock(
  "@/components/waves/drops/participation/ratings/tooltips/VoteBreakdownTooltip",
  () => ({
    __esModule: true,
    default: () => <div data-testid="tooltip" />,
  })
);

jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="progress"
      data-current={props.current}
      data-projected={props.projected}
      data-tooltip-label={props.tooltipLabel}
    />
  ),
}));

describe("ParticipationDropRatingsTotalSection", () => {
  const drop: any = {
    id: "d1",
    wave: { voting_credit_type: ApiWaveCreditType.Tdh },
    rating: 5,
    realtime_rating: 15,
    rating_prediction: 10,
  };
  const theme = { text: "t", ring: "r", indicator: "i" };
  const ratingsData = { currentRating: 5, hasRaters: true, userRating: 0 };
  it("renders rating text and passes values to progress component", () => {
    render(
      <ParticipationDropRatingsTotalSection
        drop={drop}
        theme={theme}
        ratingsData={ratingsData}
        rank={1}
      />
    );
    expect(screen.getByText("TDH Total")).toBeInTheDocument();
    const progress = screen.getByTestId("progress");
    expect(progress.getAttribute("data-current")).toBe("5");
    expect(progress.getAttribute("data-projected")).toBe("10");
  });

  it("renders approve threshold progress", () => {
    const repDrop = {
      ...drop,
      rating: 42,
      realtime_rating: 80,
      wave: { voting_credit_type: ApiWaveCreditType.Rep },
    };
    const repRatingsData = {
      currentRating: 42,
      hasRaters: false,
      userRating: 0,
    };

    render(
      <ParticipationDropRatingsTotalSection
        drop={repDrop}
        theme={theme}
        ratingsData={repRatingsData}
        rank={1}
        winningThreshold={100}
      />
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Needs 58")).toBeInTheDocument();
    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-current", "42");
    expect(progress).toHaveAttribute("data-projected", "80");
    expect(progress).toHaveAttribute(
      "data-tooltip-label",
      "Votes given now"
    );
  });

  it("shows Reached threshold before the winner state refreshes", () => {
    render(
      <ParticipationDropRatingsTotalSection
        drop={{ ...drop, rating: 8 }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 8 }}
        rank={1}
        winningThreshold={8}
      />
    );

    expect(screen.getByText("Reached threshold")).toBeInTheDocument();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
  });

  it("shows and updates the approval countdown while the min time is running", () => {
    jest.useFakeTimers().setSystemTime(new Date(1_000_000));
    const { unmount } = render(
      <ParticipationDropRatingsTotalSection
        drop={{
          ...drop,
          rating: 8,
          over_threshold_since_ms: 1_000_000,
        }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 8 }}
        rank={1}
        winningThreshold={8}
        winningThresholdMinDurationMs={480_000}
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

  it("keeps the fallback reached label when countdown timing is missing", () => {
    render(
      <ParticipationDropRatingsTotalSection
        drop={{ ...drop, rating: 8 }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 8 }}
        rank={1}
        winningThreshold={8}
        winningThresholdMinDurationMs={480_000}
      />
    );

    expect(screen.getByText("Reached threshold")).toBeInTheDocument();
  });

  it("shows Closed only when voting is really closed", () => {
    const { rerender } = render(
      <ParticipationDropRatingsTotalSection
        drop={{ ...drop, rating: 5 }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 5 }}
        rank={1}
        winningThreshold={8}
      />
    );

    expect(screen.getByText("Needs 3")).toBeInTheDocument();
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();

    rerender(
      <ParticipationDropRatingsTotalSection
        drop={{ ...drop, rating: 5 }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 5 }}
        rank={1}
        winningThreshold={8}
        isVotingClosed={true}
      />
    );

    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("does not show Approved for rank-only approve drops", () => {
    const { rerender } = render(
      <ParticipationDropRatingsTotalSection
        drop={{ ...drop, rating: 6, rank: 1 }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 6 }}
        rank={1}
        winningThreshold={8}
      />
    );

    expect(screen.getByText("Needs 2")).toBeInTheDocument();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();

    rerender(
      <ParticipationDropRatingsTotalSection
        drop={{ ...drop, rating: 8, rank: 1 }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 8 }}
        rank={1}
        winningThreshold={8}
      />
    );

    expect(screen.getByText("Reached threshold")).toBeInTheDocument();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
  });

  it("shows Approved for official approved drops", () => {
    render(
      <ParticipationDropRatingsTotalSection
        drop={{
          ...drop,
          rating: 8,
          rank: 1,
          winning_context: { place: 1, awards: [], decision_time: 123 },
        }}
        theme={theme}
        ratingsData={{ ...ratingsData, currentRating: 8 }}
        rank={1}
        winningThreshold={8}
        winningThresholdMinDurationMs={480_000}
      />
    );

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText(/Approving in/)).not.toBeInTheDocument();
    expect(screen.queryByText("Reached threshold")).not.toBeInTheDocument();
  });

  it("keeps total text when threshold is missing or zero", () => {
    const { rerender } = render(
      <ParticipationDropRatingsTotalSection
        drop={drop}
        theme={theme}
        ratingsData={ratingsData}
        rank={1}
        winningThreshold={null}
      />
    );

    expect(screen.getByText("TDH Total")).toBeInTheDocument();
    expect(screen.queryByText("/")).not.toBeInTheDocument();

    rerender(
      <ParticipationDropRatingsTotalSection
        drop={drop}
        theme={theme}
        ratingsData={ratingsData}
        rank={1}
        winningThreshold={0}
      />
    );

    expect(screen.getByText("TDH Total")).toBeInTheDocument();
    expect(screen.queryByText("/")).not.toBeInTheDocument();
  });
});
