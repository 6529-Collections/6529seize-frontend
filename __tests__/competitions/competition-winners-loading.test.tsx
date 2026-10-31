import { render, screen } from "@testing-library/react";
import CompetitionWinners from "@/components/competitions/CompetitionWinners";
const mockResource = jest.fn();
const mockDrops = jest.fn();
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    wave: { id: "wave" },
    competition: {
      id: "comp",
      wave_id: "wave",
      type: "RANK",
      capabilities: [],
    },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionResource: (...args: unknown[]) => mockResource(...args),
}));
jest.mock("@/hooks/competitions/useCompetitionEntryDrops", () => ({
  useCompetitionEntryDrops: () => mockDrops(),
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => jest.fn(),
}));
jest.mock("@/hooks/waves/useWaveProposalCardPresentation", () => ({
  useWaveProposalCardPresentation: () => "default",
}));
jest.mock("@/helpers/competition-presentation.helpers", () => ({
  competitionPresentationWave: () => ({
    wave: { decisions_strategy: { is_rolling: true } },
  }),
  competitionAward: (value: unknown) => value,
}));
jest.mock("@/helpers/waves/wave-metadata.helpers", () => ({
  getWaveOutcomeVisibilityFromMetadata: () => true,
}));
jest.mock("@/components/waves/winners/WaveWinnersTimeline", () => ({
  WaveWinnersTimeline: ({
    decisionPoints,
  }: {
    decisionPoints: { winners: { drop: { title: string } }[] }[];
  }) => (
    <div>
      {decisionPoints
        .flatMap((point) => point.winners)
        .map((winner) => (
          <p key={winner.drop.title}>{winner.drop.title}</p>
        ))}
    </div>
  ),
}));
jest.mock("@/components/competitions/CompetitionLoadMore", () => ({
  CompetitionLoadMore: () => null,
}));
const loaded = {
  data: {
    entry: { id: "ready", rank: 1, won_at: 100, decision_id: "decision" },
    drop: { title: "Ready winner" },
    awards: [],
  },
};
beforeEach(() => {
  mockResource.mockReturnValue({
    data: {
      pages: [
        {
          data: [
            { id: "ready", drop_id: "drop-ready" },
            { id: "slow", drop_id: "drop-slow" },
          ],
        },
      ],
    },
    isPending: false,
    isError: false,
  });
});
it("shows available winners while another winner is still loading", () => {
  mockDrops.mockReturnValue([loaded, { isPending: true }]);
  render(<CompetitionWinners />);
  expect(screen.getByText("Ready winner")).toBeVisible();
  expect(mockResource).toHaveBeenCalledTimes(1);
  expect(mockResource).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "comp" },
    "winners",
    { direction: "DESC", limit: "10", include: "cards" }
  );
});
it("keeps available winners visible when another card fails", () => {
  mockDrops.mockReturnValue([loaded, { isError: true }]);
  render(<CompetitionWinners />);
  expect(screen.getByText("Ready winner")).toBeVisible();
  expect(screen.getByRole("alert")).toBeVisible();
});
