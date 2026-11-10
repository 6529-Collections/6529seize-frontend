import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useCompetitionSubmissionWave } from "@/hooks/competitions/useCompetitionSubmissionWave";
import { useWave } from "@/hooks/useWave";
import { fetchCompetitionResource } from "@/services/api/competitions-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { id: "profile" } }),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({}),
}));

jest.mock("@/services/api/competitions-api", () => ({
  ...jest.requireActual("@/services/api/competitions-api"),
  fetchCompetitionResource: jest.fn(),
}));

const competition = {
  id: "decision",
  wave_id: "wave",
  capabilities: [ApiCompetitionCapability.MainStage],
  lifecycle: "PUBLISHED",
  participation: {
    starts_at: null,
    ends_at: null,
    max_entries_per_participant: 3,
  },
  permissions: { submit: true },
  voting: { starts_at: null, ends_at: null },
  winners: {},
  decisions: { strategy: null },
} as ApiCompetition;

const wave = {
  id: "wave",
  competition,
  chat: {},
  voting: {},
  metrics: { your_participation_drops_count: 1 },
} as unknown as ApiWave;

const activePage = (count: number) => ({
  data: Array.from({ length: count }, (_, index) => ({
    id: `entry-${index}`,
  })) as ApiCompetitionEntry[],
  next_cursor: null,
  has_more: false,
});

const fetchEntries = jest.mocked(fetchCompetitionResource);

/** Run the capacity query and the wave eligibility calculation against a fresh cache. */
function renderParticipation() {
  const client = new QueryClient();
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () => {
      const target = useCompetitionSubmissionWave(wave);
      return useWave(target.wave).participation;
    },
    { wrapper }
  );
  return { ...hook, client };
}

beforeEach(() => {
  fetchEntries.mockReset();
});

it("checks native capacity and updates the submission action after entry changes", async () => {
  fetchEntries
    .mockResolvedValueOnce(activePage(2))
    .mockResolvedValueOnce(activePage(3))
    .mockResolvedValueOnce(activePage(2));
  const { result, client } = renderParticipation();

  expect(result.current.canSubmitNow).toBe(false);
  await waitFor(() => expect(result.current.canSubmitNow).toBe(true));
  expect(result.current.remainingSubmissions).toBe(1);
  expect(fetchEntries).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "decision" },
    "entries",
    {
      status: ApiCompetitionEntryStatus.Active,
      submitter: "profile",
      limit: "3",
    },
    expect.any(AbortSignal)
  );

  const refresh = () =>
    client.invalidateQueries({
      queryKey: [QueryKey.COMPETITION_RESOURCE, { competition_id: "decision" }],
    });

  await act(refresh);
  await waitFor(() => expect(result.current.hasReachedLimit).toBe(true));
  expect(result.current.canSubmitNow).toBe(false);
  expect(result.current.remainingSubmissions).toBe(0);

  await act(refresh);
  await waitFor(() => expect(result.current.canSubmitNow).toBe(true));
  expect(result.current.hasReachedLimit).toBe(false);
});

it("recovers from a failed count while the header stays mounted", async () => {
  jest.useFakeTimers();
  try {
    fetchEntries
      .mockRejectedValueOnce(new Error("Temporary network error"))
      .mockRejectedValueOnce(new Error("Temporary network error"))
      .mockResolvedValueOnce(activePage(2));
    const { result, unmount } = renderParticipation();
    await act(() => jest.advanceTimersByTimeAsync(1_000));
    expect(fetchEntries).toHaveBeenCalledTimes(2);
    expect(result.current.canSubmitNow).toBe(false);

    await act(() => jest.advanceTimersByTimeAsync(15_000));
    await waitFor(() => expect(result.current.canSubmitNow).toBe(true));
    expect(fetchEntries).toHaveBeenCalledTimes(3);
    unmount();
  } finally {
    jest.useRealTimers();
  }
});
