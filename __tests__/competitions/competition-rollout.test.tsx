import { render, screen } from "@testing-library/react";
import CompetitionDetail from "@/components/competitions/CompetitionDetail";
let mockEnabled = false;
let mockPrimary: string | null = null;
const mockCompetition = {
  id: "native",
  wave_id: "wave",
  title: "Readable native competition",
  type: "RANK",
  lifecycle: "PUBLISHED",
  computed_phase: "VOTING_OPEN",
  config_version: 1,
  permissions: { submit: true, administer: true },
  voting: { ends_at: null },
};
jest.mock("@/helpers/competition.helpers", () => ({
  ...jest.requireActual("@/helpers/competition.helpers"),
  isMultiCompetitionEnabled: () => mockEnabled,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/waves/wave/competitions/native",
  useSearchParams: () => new URLSearchParams("edit=1"),
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: { id: "wave" } }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionHub: () => ({
    data: { id: "wave", legacy_primary_competition_id: mockPrimary },
  }),
  useCompetitionDetail: () => ({ data: mockCompetition }),
  useCompetitionPauseState: () => ({ isSuccess: true, data: false }),
}));
jest.mock("@/components/brain/my-stream/MyStreamWave", () => () => (
  <div>Original primary experience</div>
));
jest.mock("@/components/competitions/CompetitionAdmin", () => () => (
  <button>Manage native competition</button>
));
jest.mock("@/components/competitions/CompetitionResources", () => () => (
  <div>Readable native entries</div>
));
jest.mock("@/components/competitions/CompetitionDraftEditor", () => () => (
  <div>Native draft editor</div>
));
jest.mock("@/components/competitions/CompetitionEntryForm", () => () => null);
jest.mock(
  "@/components/competitions/CompetitionExistingEntry",
  () => () => null
);
beforeEach(() => {
  mockEnabled = false;
  mockPrimary = null;
});
it("preserves native deep-link reads with edits and mutation controls hidden when disabled", () => {
  render(<CompetitionDetail waveId="wave" competitionId="native" />);
  expect(
    screen.getByRole("heading", { name: "Readable native competition" })
  ).toBeVisible();
  expect(screen.getByText("Readable native entries")).toBeVisible();
  expect(screen.queryByText("Native draft editor")).toBeNull();
  expect(screen.queryByRole("button", { name: "Submit an entry" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Use an existing drop" })
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Manage native competition" })
  ).toBeNull();
});
it("enables the explicit edit route with the flag on", () => {
  mockEnabled = true;
  render(<CompetitionDetail waveId="wave" competitionId="native" />);
  expect(screen.getByText("Native draft editor")).toBeVisible();
});
it("preserves the original primary experience with the flag off", () => {
  mockPrimary = "native";
  render(<CompetitionDetail waveId="wave" competitionId="native" />);
  expect(screen.getByText("Original primary experience")).toBeVisible();
});
