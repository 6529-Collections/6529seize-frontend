import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import CompetitionMySubmissions from "@/components/competitions/CompetitionMySubmissions";
import CompetitionResources from "@/components/competitions/CompetitionResources";
import { competitionSubmissionReceiptKey } from "@/helpers/competition-submission.helpers";
import { commonApiFetch } from "@/services/api/common-api";

let mockCompetitionId = "alpha";
let mockProfileId = "me";
let mockEntryId: string | null = null;
let mockEntries: Array<{
  id: string;
  wave_id: string;
  competition_id: string;
  drop_id: string;
  submitter: { id: string };
  status: string;
}> = [];
const mockReadEntries = jest.fn();
const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: mockProfileId },
    activeProfileProxy: null,
  }),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: {
      id: mockCompetitionId,
      wave_id: "wave",
      title: "Art competition",
    },
  }),
}));
jest.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(mockEntryId ? `entry=${mockEntryId}` : ""),
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => mockNavigate,
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => `${mockProfileId}:self`,
  useCompetitionResource: (...args: unknown[]) => {
    mockReadEntries(...args);
    return {
      data: { pages: [{ data: mockEntries }] },
      isPending: false,
      isError: false,
      isFetching: false,
      hasNextPage: false,
      refetch: mockRefetch,
    };
  },
}));
jest.mock("@/components/waves/leaderboard/MySubmissionsDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: (isApp: boolean) => ReactNode;
  }) => (isOpen ? <div role="dialog">{children(false)}</div> : null),
}));
jest.mock("@/components/competitions/CompetitionEntryCard", () => ({
  __esModule: true,
  default: ({
    entryId,
    onOpenDrop,
  }: {
    entryId: string;
    onOpenDrop?: () => void;
  }) => (
    <button data-testid="entry" onClick={onOpenDrop}>
      {entryId}
    </button>
  ),
}));

const entry = {
  id: "entry-alpha",
  wave_id: "wave",
  competition_id: "alpha",
  drop_id: "drop",
  submitter: { id: "me" },
  status: "ACTIVE",
};

function renderWithClient(node: ReactNode, accepted = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  if (accepted)
    client.setQueryData(
      competitionSubmissionReceiptKey(
        { waveId: "wave", competitionId: "alpha" },
        "me:self",
        entry.id
      ),
      entry
    );
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCompetitionId = "alpha";
  mockProfileId = "me";
  mockEntryId = null;
  mockEntries = [entry];
});

it("requests only the current submitter and selected competition, and closes on competition change", () => {
  const view = renderWithClient(<CompetitionMySubmissions />);
  fireEvent.click(screen.getByRole("button", { name: "My submissions" }));
  expect(mockReadEntries).toHaveBeenLastCalledWith(
    { waveId: "wave", competitionId: "alpha" },
    "entries",
    { submitter: "me", sort: "submitted_at", direction: "DESC" },
    true
  );
  expect(screen.getByTestId("entry")).toHaveTextContent("entry-alpha");
  mockCompetitionId = "beta";
  view.rerender(
    <QueryClientProvider client={new QueryClient()}>
      <CompetitionMySubmissions />
    </QueryClientProvider>
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("does not display entries returned for another submitter", () => {
  mockEntries = [{ ...entry, submitter: { id: "other" } }];
  renderWithClient(<CompetitionMySubmissions />);
  fireEvent.click(screen.getByRole("button", { name: "My submissions" }));
  expect(screen.queryByTestId("entry")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

it("closes My submissions when its artwork is opened", () => {
  renderWithClient(<CompetitionMySubmissions />);
  fireEvent.click(screen.getByRole("button", { name: "My submissions" }));
  fireEvent.click(screen.getByTestId("entry"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("preserves valid personal entries when another row has the wrong scope", () => {
  mockEntries = [
    entry,
    { ...entry, id: "other-entry", competition_id: "beta" },
  ];
  renderWithClient(<CompetitionMySubmissions />);
  fireEvent.click(screen.getByRole("button", { name: "My submissions" }));
  expect(screen.getAllByTestId("entry")).toHaveLength(1);
  expect(screen.getByTestId("entry")).toHaveTextContent("entry-alpha");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Showing the entries already loaded."
  );
});

it("recovers a saved native entry after its status lookup fails without creating another entry", async () => {
  mockEntryId = entry.id;
  jest
    .mocked(commonApiFetch)
    .mockRejectedValueOnce(new Error("Temporary read failure"));
  jest.mocked(commonApiFetch).mockResolvedValueOnce(entry);
  renderWithClient(<CompetitionResources tab="leaderboard" />, true);
  await waitFor(() =>
    expect(screen.getByText("Your artwork is saved.")).toBeVisible()
  );
  await waitFor(() =>
    expect(screen.getByText(/We couldn’t confirm/)).toBeVisible()
  );
  fireEvent.click(screen.getByRole("button", { name: "Check again" }));
  await waitFor(() =>
    expect(screen.getByText("Your entry is in Art competition.")).toBeVisible()
  );
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "View my entry" }));
  expect(mockNavigate).toHaveBeenCalledWith({ id: "drop" });
});

it("does not claim another viewer’s direct entry as your submission", async () => {
  mockEntryId = entry.id;
  mockProfileId = "other";
  jest.mocked(commonApiFetch).mockResolvedValueOnce(entry);
  renderWithClient(<CompetitionResources tab="leaderboard" />, true);
  await waitFor(() => expect(screen.getByTestId("entry")).toBeVisible());
  expect(screen.queryByText(/Your entry is in/)).not.toBeInTheDocument();
  expect(screen.queryByText("Your artwork is saved.")).not.toBeInTheDocument();
});
