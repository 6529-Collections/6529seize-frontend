import { fireEvent, render, screen } from "@testing-library/react";
import CompetitionDetail from "@/components/competitions/CompetitionDetail";
import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import { WAVE_DISPLAY_METADATA_KEYS } from "@/helpers/waves/wave-metadata.helpers";
let mockEnabled = false;
let mockPrimary: string | null = null;
let mockSearch = "edit=1";
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockCompetition = {
  id: "native",
  wave_id: "wave",
  title: "Readable native competition",
  description: "Competition description",
  type: "RANK",
  lifecycle: "PUBLISHED",
  computed_phase: "VOTING_OPEN",
  config_version: 1,
  permissions: { submit: true, administer: true },
  voting: { ends_at: null },
  presentation: [] as ApiCreateWaveMetadataRequest[],
};
jest.mock("@/helpers/competition.helpers", () => ({
  ...jest.requireActual("@/helpers/competition.helpers"),
  isMultiCompetitionEnabled: () => mockEnabled,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/waves/wave/competitions/native",
  useSearchParams: () => new URLSearchParams(mockSearch),
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
jest.mock(
  "@/components/competitions/CompetitionAdmin",
  () => () => (mockEnabled ? <button>Manage native competition</button> : null)
);
jest.mock(
  "@/components/competitions/CompetitionResources",
  () =>
    ({ onCreateDrop }: { onCreateDrop?: () => void }) => (
      <div>
        Readable native entries
        {onCreateDrop && (
          <button onClick={onCreateDrop}>Submit an entry</button>
        )}
      </div>
    )
);
jest.mock(
  "@/components/competitions/CompetitionDraftEditor",
  () =>
    ({ onClose }: { onClose: () => void }) => (
      <div>
        Native draft editor<button onClick={onClose}>Close editor</button>
      </div>
    )
);
jest.mock("@/components/competitions/CompetitionEntryForm", () => () => null);

beforeEach(() => {
  mockEnabled = false;
  mockCompetition.lifecycle = "PUBLISHED";
  mockCompetition.type = "RANK";
  mockCompetition.presentation = [];
  mockReplace.mockClear();
  mockPrimary = null;
  mockSearch = "edit=1";
  mockPush.mockClear();
});
it("preserves native deep-link reads with edits and mutation controls hidden when disabled", () => {
  render(<CompetitionDetail waveId="wave" competitionId="native" />);
  expect(
    screen.getByRole("heading", { name: "Readable native competition" })
  ).toBeVisible();
  expect(screen.getByText("Readable native entries")).toBeVisible();
  expect(screen.queryByRole("tab", { name: "Entries" })).toBeNull();
  expect(screen.getByRole("tab", { name: "Configuration" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.queryByText("Native draft editor")).toBeNull();
  expect(screen.queryByRole("button", { name: "Submit an entry" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Use an existing drop" })
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Manage native competition" })
  ).toBeNull();
});
it("keeps published edit links in Configuration with the flag on", () => {
  mockEnabled = true;
  render(<CompetitionDetail waveId="wave" competitionId="native" />);
  expect(screen.queryByText("Native draft editor")).toBeNull();
  expect(screen.getByRole("tabpanel", { name: "Configuration" })).toBeVisible();
});
it("preserves the original primary experience with the flag off", () => {
  mockPrimary = "native";
  render(<CompetitionDetail waveId="wave" competitionId="native" />);
  expect(screen.getByText("Original primary experience")).toBeVisible();
});

it.each<[string, string, string, string]>([
  ["", "", "Proposals", "Approved"],
  ["Proposals", "Approved", "Proposals", "Approved"],
  ["Suggestions", "Accepted", "Suggestions", "Accepted"],
  ["Same", "Same", "Proposals", "Approved"],
])(
  "resolves Approve tab mappings (%s, %s) with the original display defaults",
  (approvals, approved, expectedApprovals, expectedApproved) => {
    mockCompetition.type = "APPROVE";
    mockSearch = "";
    mockCompetition.presentation = [
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: approvals,
      },
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: approved,
      },
    ].filter((item) => item.data_value);
    const { rerender } = render(
      <CompetitionDetail waveId="wave" competitionId="native" />
    );
    expect(
      screen.getByRole("tab", { name: expectedApprovals })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tabpanel", { name: expectedApprovals })
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("tab", { name: expectedApproved })
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/waves/wave/competitions/native?tab=decisions",
      { scroll: false }
    );
    mockSearch = "tab=decisions";
    rerender(<CompetitionDetail waveId="wave" competitionId="native" />);
    expect(
      screen.getByRole("tabpanel", { name: expectedApproved })
    ).toBeVisible();
    expect(
      screen.queryByRole("tab", { name: "Leaderboard" })
    ).toBeNull();
    expect(
      screen.queryByRole("tab", { name: "Winners" })
    ).toBeNull();
  }
);

it("keeps the entry action in the competition view and exposes details and management through Configuration", () => {
  mockEnabled = true;
  mockSearch = "";
  const { rerender } = render(
    <CompetitionDetail waveId="wave" competitionId="native" />
  );
  expect(screen.getByRole("tabpanel", { name: "Leaderboard" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Submit an entry" })).toBeVisible();
  expect(screen.queryByText("Competition description")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Manage native competition" })
  ).toBeNull();

  fireEvent.click(screen.getByRole("tab", { name: "Configuration" }));
  expect(mockPush).toHaveBeenCalledWith(
    "/waves/wave/competitions/native?tab=rules",
    { scroll: false }
  );
  mockSearch = "tab=rules";
  rerender(<CompetitionDetail waveId="wave" competitionId="native" />);
  expect(screen.getByRole("tab", { name: "Configuration" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByRole("tabpanel", { name: "Configuration" })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Manage native competition" })
  ).toBeVisible();
});

it.each(["", "tab=rules", "edit=1"])(
  "opens drafts directly in the setup wizard for query %s",
  (search) => {
    mockEnabled = true;
    mockSearch = search;
    mockCompetition.lifecycle = "DRAFT";
    render(<CompetitionDetail waveId="wave" competitionId="native" />);
    expect(screen.getByText("Native draft editor")).toBeVisible();
    expect(screen.queryByText("Readable native entries")).toBeNull();
    expect(screen.queryByRole("tab", { name: "Leaderboard" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
    expect(mockReplace).toHaveBeenCalledWith("/waves/wave/competitions");
  }
);
