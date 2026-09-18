import React from "react";
import { act, render, screen } from "@testing-library/react";
import { WaveLeaderboardTime } from "@/components/waves/leaderboard/WaveLeaderboardTime";
import type { ApiWave } from "@/generated/models/ApiWave";
import { Time } from "@/helpers/time";

jest.mock("@/hooks/waves/useDecisionPoints", () => ({
  useDecisionPoints: jest.fn(),
}));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("@/components/waves/leaderboard/time/TimelineToggleHeader", () => ({
  TimelineToggleHeader: () => <div data-testid="header" />,
}));
jest.mock(
  "@/components/waves/leaderboard/time/ExpandedTimelineContent",
  () => ({ ExpandedTimelineContent: () => <div data-testid="expanded" /> })
);
jest.mock(
  "@/components/waves/leaderboard/time/CompactDroppingPhaseCard",
  () => ({ CompactDroppingPhaseCard: () => <div data-testid="drop" /> })
);
jest.mock("@/components/waves/leaderboard/time/CompactVotingPhaseCard", () => ({
  CompactVotingPhaseCard: () => <div data-testid="vote" />,
}));
jest.mock("@/helpers/time", () => ({
  Time: { currentMillis: jest.fn(() => 0) },
}));

const useDecisionPoints =
  require("@/hooks/waves/useDecisionPoints").useDecisionPoints;
const useWave = require("@/hooks/useWave").useWave;

describe("WaveLeaderboardTime", () => {
  it("shows timeline when multi decision", () => {
    useWave.mockReturnValue({
      decisions: { multiDecision: true },
      isCurationWave: false,
      pauses: {
        isPaused: false,
        currentPause: null,
        nextPause: null,
        showPause: jest.fn(() => null),
        hasDecisionsBeforePause: jest.fn(() => false),
        filterDecisionsDuringPauses: jest.fn((decisions) => decisions),
        getNextValidDecision: jest.fn(() => null),
      },
    });
    useDecisionPoints.mockReturnValue({
      allDecisions: [{ timestamp: 10 }],
      hasMorePast: false,
      hasMoreFuture: false,
      loadMorePast: jest.fn(),
      loadMoreFuture: jest.fn(),
      remainingPastCount: 0,
      remainingFutureCount: 0,
    });
    render(<WaveLeaderboardTime wave={{} as any} />);
    const header = screen.getByTestId("header");
    expect(header).toBeInTheDocument();
    expect(header.parentElement).toHaveClass(
      "tw-box-border",
      "tw-h-[38px]",
      "tw-border-white/[0.06]"
    );
    expect(screen.queryByTestId("drop")).toBeNull();
  });

  it("shows compact cards when not multi decision", () => {
    useWave.mockReturnValue({
      decisions: { multiDecision: false },
      isCurationWave: false,
      pauses: {
        isPaused: false,
        currentPause: null,
        nextPause: null,
        showPause: jest.fn(() => null),
        hasDecisionsBeforePause: jest.fn(() => false),
        filterDecisionsDuringPauses: jest.fn((decisions) => decisions),
        getNextValidDecision: jest.fn(() => null),
      },
    });
    useDecisionPoints.mockReturnValue({
      allDecisions: [],
      hasMorePast: false,
      hasMoreFuture: false,
      loadMorePast: jest.fn(),
      loadMoreFuture: jest.fn(),
      remainingPastCount: 0,
      remainingFutureCount: 0,
    });
    render(<WaveLeaderboardTime wave={{} as any} />);
    expect(screen.getByTestId("drop")).toBeInTheDocument();
    expect(screen.getByTestId("vote")).toBeInTheDocument();
    expect(screen.queryByTestId("header")).toBeNull();
  });

  it("hides compact cards for curation waves when not multi decision", () => {
    useWave.mockReturnValue({
      decisions: { multiDecision: false },
      isCurationWave: true,
      pauses: {
        isPaused: false,
        currentPause: null,
        nextPause: null,
        showPause: jest.fn(() => null),
        hasDecisionsBeforePause: jest.fn(() => false),
        filterDecisionsDuringPauses: jest.fn((decisions) => decisions),
        getNextValidDecision: jest.fn(() => null),
      },
    });
    useDecisionPoints.mockReturnValue({
      allDecisions: [],
      hasMorePast: false,
      hasMoreFuture: false,
      loadMorePast: jest.fn(),
      loadMoreFuture: jest.fn(),
      remainingPastCount: 0,
      remainingFutureCount: 0,
    });

    render(<WaveLeaderboardTime wave={{} as any} />);
    expect(screen.queryByTestId("drop")).toBeNull();
    expect(screen.queryByTestId("vote")).toBeNull();
    expect(screen.queryByTestId("header")).toBeNull();
  });
});

describe("single-decision winner announcement", () => {
  // Keep the expected calendar date local, regardless of the test runner's TZ.
  const announcement = new Date(2026, 8, 20, 15, 4).getTime();
  const now = announcement - (2 * 24 * 60 + 3 * 60 + 4) * 60_000;
  const wave = {} as ApiWave;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(Time.currentMillis).mockReturnValue(now);
    useWave.mockReturnValue({
      decisions: { multiDecision: false },
      isCurationWave: false,
      pauses: {
        showPause: () => null,
        filterDecisionsDuringPauses: (decisions: { decision_time: number }[]) =>
          decisions,
      },
    });
    useDecisionPoints.mockReturnValue({
      allDecisions: [{ timestamp: announcement }],
      hasMorePast: false,
      hasMoreFuture: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(Time.currentMillis).mockReturnValue(0);
  });

  it("shows the scheduled announcement beside dropping and voting", () => {
    render(<WaveLeaderboardTime wave={wave} />);

    expect(screen.getByTestId("drop")).toBeInTheDocument();
    expect(screen.getByTestId("vote")).toBeInTheDocument();
    expect(screen.getByText("Next winners announced in")).toBeInTheDocument();
    expect(screen.getByText("2d 3h 4m")).toBeInTheDocument();
    const announcementDate = screen.getByText("Sep 20");
    expect(announcementDate).toHaveAttribute(
      "dateTime",
      new Date(announcement).toISOString()
    );
    expect(announcementDate).toHaveAccessibleName(
      /September 20, 2026.*\d.*(?:AM|PM)/
    );
    expect(announcementDate).toHaveAttribute(
      "title",
      announcementDate.getAttribute("aria-label")
    );
  });

  it("updates the countdown and removes it at the announcement time", () => {
    render(<WaveLeaderboardTime wave={wave} />);

    act(() => {
      jest.mocked(Time.currentMillis).mockReturnValue(announcement - 60_000);
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("0h 1m")).toBeInTheDocument();

    act(() => {
      jest.mocked(Time.currentMillis).mockReturnValue(announcement);
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.queryByText("Next winners announced in")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("vote")).toBeInTheDocument();
  });

  it.each([
    { name: "unscheduled", allDecisions: [] },
    { name: "completed", allDecisions: [{ timestamp: now - 1000 }] },
  ])("omits the countdown for $name waves", ({ allDecisions }) => {
    useDecisionPoints.mockReturnValue({ allDecisions, hasMoreFuture: false });
    render(<WaveLeaderboardTime wave={wave} />);

    expect(
      screen.queryByText("Next winners announced in")
    ).not.toBeInTheDocument();
  });

  it("omits announcements excluded by a pause", () => {
    useWave.mockReturnValue({
      decisions: { multiDecision: false },
      isCurationWave: false,
      pauses: {
        filterDecisionsDuringPauses: () => [],
      },
    });
    render(<WaveLeaderboardTime wave={wave} />);

    expect(
      screen.queryByText("Next winners announced in")
    ).not.toBeInTheDocument();
  });
});
