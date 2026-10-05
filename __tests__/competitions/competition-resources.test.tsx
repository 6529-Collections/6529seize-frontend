import { fireEvent, render, screen } from "@testing-library/react";
import CompetitionResources from "@/components/competitions/CompetitionResources";

const mockAwards = {
  data: { pages: [{ data: [] }] },
  isError: true,
  isPending: false,
  hasNextPage: true,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
};
const mockOutcomes = {
  ...mockAwards,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
  isError: false,
  hasNextPage: false,
};

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    wave: { id: "wave" },
    competition: { id: "native", wave_id: "wave" },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionEntryDrops", () => ({
  useCompetitionEntryDrops: () => [],
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => jest.fn(),
}));
jest.mock("@/helpers/competition-presentation.helpers", () => ({
  competitionPresentationWave: () => ({ wave: { decisions_strategy: null } }),
}));
jest.mock("@/components/waves/winners/drops/WaveWinnersDrops", () => ({
  WaveWinnersDrops: () => null,
}));
jest.mock("@/components/waves/winners/podium/WaveWinnersPodium", () => ({
  WaveWinnersPodium: () => null,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionResource: (_identity: unknown, resource: string) =>
    resource === "awards" ? mockAwards : mockOutcomes,
}));
jest.mock("@/components/competitions/CompetitionEntryCard", () => () => null);
jest.mock("@/components/competitions/CompetitionCredits", () => () => null);
jest.mock("@/components/competitions/CompetitionRules", () => () => null);

it("offers retry and pauses award pagination until the error recovers", () => {
  const { rerender } = render(<CompetitionResources tab="decisions" />);

  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mockAwards.refetch).toHaveBeenCalledTimes(1);
  expect(mockAwards.fetchNextPage).not.toHaveBeenCalled();

  mockAwards.isError = false;
  rerender(<CompetitionResources tab="decisions" />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(mockAwards.fetchNextPage).toHaveBeenCalledTimes(1);
});
