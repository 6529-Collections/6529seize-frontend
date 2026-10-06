import { render, screen } from "@testing-library/react";
import CompetitionLeaderboard from "@/components/competitions/CompetitionLeaderboard";
let mockType = "RANK";
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    wave: { id: "wave" },
    competition: {
      id: "comp",
      type: mockType,
      lifecycle: "PUBLISHED",
      permissions: { vote: true, submit: true },
      winners: {
        max_winners: 3,
        winning_min_threshold: 100,
        winning_threshold_min_duration_ms: 5000,
      },
      decisions: { time_lock_ms: null },
      voting: { ends_at: null },
    },
  }),
}));
jest.mock("@/helpers/competition-presentation.helpers", () => ({
  competitionPresentationWave: () => ({ id: "wave" }),
}));
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => true,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionResource: (_identity: unknown, resource: string) => ({
    data: {
      pages: [
        {
          data:
            resource === "leaderboard"
              ? [{ entry_id: "entry", drop_id: "drop" }]
              : [],
        },
      ],
    },
    isPending: false,
    hasNextPage: false,
    isError: false,
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionEntryDrops", () => ({
  useCompetitionEntryDrops: () => [{ data: { drop: { id: "drop" } } }],
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => jest.fn(),
}));
jest.mock("@/hooks/useWaveDropsLeaderboard", () => ({
  WaveDropsLeaderboardSort: { RANK: "RANK" },
}));
jest.mock(
  "@/components/waves/leaderboard/header/WaveleaderboardHeader",
  () => ({ WaveLeaderboardHeader: () => <div>Existing toolbar</div> })
);
jest.mock("@/components/waves/leaderboard/WaveLeaderboardTime", () => ({
  WaveLeaderboardTime: () => <div>Rank schedule</div>,
}));
jest.mock("@/components/waves/approval/WaveApprovalStatusBar", () => ({
  __esModule: true,
  default: ({ approvedCount }: { approvedCount: number }) => (
    <div>Approved: {approvedCount}</div>
  ),
}));
jest.mock(
  "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop",
  () => ({
    DefaultWaveLeaderboardDrop: ({
      winningThreshold,
      winningThresholdMinDurationMs,
    }: {
      winningThreshold: number | null;
      winningThresholdMinDurationMs: number;
    }) => (
      <div>
        Rich card {winningThreshold ?? "rank"} {winningThresholdMinDurationMs}
      </div>
    ),
  })
);
jest.mock(
  "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem",
  () => ({ WaveLeaderboardGridItem: () => null })
);
jest.mock("@/components/competitions/CompetitionLoadMore", () => ({
  CompetitionLoadMore: () => null,
}));
jest.mock("@/components/competitions/CompetitionState", () => ({
  CompetitionState: () => null,
}));
it("uses the existing Rank schedule, controls and cards", () => {
  mockType = "RANK";
  render(<CompetitionLeaderboard />);
  expect(screen.getByText("Rank schedule")).toBeVisible();
  expect(screen.getByText("Existing toolbar")).toBeVisible();
  expect(screen.getByText("Rich card rank 5000")).toBeVisible();
});
it("uses the existing Approve status and threshold presentation", () => {
  mockType = "APPROVE";
  render(<CompetitionLeaderboard />);
  expect(screen.getByText("Approved: 0")).toBeVisible();
  expect(screen.queryByText("Rank schedule")).toBeNull();
  expect(screen.getByText("Rich card 100 5000")).toBeVisible();
});
