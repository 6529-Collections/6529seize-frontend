import { fireEvent, render, screen } from "@testing-library/react";
import CompetitionVotes from "@/components/competitions/CompetitionVotes";

let mockSearch = "tab=votes&curation=kept";
let mockLegacy: string | null = null;
let mockId = "alpha";
let mockViewer: string | undefined = "viewer";
const mockReplace = jest.fn();
const mockConnect = jest.fn().mockResolvedValue(undefined);
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnectFresh: mockConnect }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => `/waves/wave/competitions/${mockId}`,
  useSearchParams: () => new URLSearchParams(mockSearch),
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: { id: mockId },
    hub: { legacy_primary_competition_id: mockLegacy },
    wave: { id: "wave" },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => mockViewer,
}));
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVotes",
  () => () => <div>Legacy votes</div>
);
jest.mock("@/components/competitions/CompetitionMyVotes", () => () => (
  <div>Native votes</div>
));
jest.mock("@/components/competitions/CompetitionVoters", () => () => (
  <div>Voters for selected competition</div>
));
jest.mock("@/components/competitions/CompetitionVoteActivity", () => () => (
  <div>Activity for selected competition</div>
));

beforeEach(() => {
  mockSearch = "tab=votes&curation=kept";
  mockLegacy = null;
  mockId = "alpha";
  mockViewer = "viewer";
  mockReplace.mockReset();
  mockConnect.mockClear();
});
it.each([null, "alpha"])(
  "keeps personal vote requests unmounted for guests with legacy primary %s",
  (legacy) => {
    mockViewer = undefined;
    mockLegacy = legacy;
    const { rerender } = render(<CompetitionVotes />);
    expect(
      screen.getByText("Connect your wallet to participate.")
    ).toBeVisible();
    expect(screen.queryByText("Legacy votes")).toBeNull();
    expect(screen.queryByText("Native votes")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
    expect(mockConnect).toHaveBeenCalledTimes(1);
    mockSearch = "tab=votes&voteTab=all";
    rerender(<CompetitionVotes />);
    expect(screen.getByText("Voters for selected competition")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Connect Wallet" })).toBeNull();
  }
);
it("groups all three views under Votes and preserves the chosen competition and route state", () => {
  render(<CompetitionVotes />);
  expect(screen.getByText("Native votes")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Connect Wallet" })).toBeNull();
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "My Votes",
    "All votes",
    "Activity",
  ]);
  fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
  expect(mockReplace).toHaveBeenCalledWith(
    "/waves/wave/competitions/alpha?tab=votes&curation=kept&voteTab=activity",
    { scroll: false }
  );
});
it("uses competition controls for the original primary and preserves voter deep links and panel IDs", () => {
  mockLegacy = "alpha";
  const { rerender } = render(<CompetitionVotes />);
  expect(screen.queryByText("Legacy votes")).toBeNull();
  expect(screen.getByText("Native votes")).toBeVisible();
  mockSearch = "tab=voters";
  rerender(<CompetitionVotes />);
  expect(screen.getByRole("tab", { name: "All votes" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByText("Voters for selected competition")).toBeVisible();
  mockSearch = "tab=voters&voteTab=activity";
  rerender(<CompetitionVotes />);
  expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByText("Activity for selected competition")).toBeVisible();
  mockId = "beta";
  mockSearch = "tab=votes&voteTab=activity";
  rerender(<CompetitionVotes />);
  expect(screen.getByRole("tabpanel")).toHaveAttribute(
    "id",
    "competition-beta-votes-activity"
  );
});
