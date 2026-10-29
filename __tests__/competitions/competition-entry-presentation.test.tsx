import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { fetchCompetitionEntryDrop } from "@/services/api/competition-entry-drops-api";

jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: { id: "comp", wave_id: "wave", permissions: { vote: true } },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/services/api/competition-entry-drops-api", () => ({
  fetchCompetitionEntryDrop: jest.fn(),
}));
const context = {
  competition: {
    id: "comp",
    wave_id: "wave",
    title: "Approve",
    type: "APPROVE",
    permissions: { vote: true },
    voting: {
      credit_type: "TDH",
      credit_scope: "WAVE",
      starts_at: 1,
      ends_at: 5000,
    },
  },
  entry: {
    id: "entry",
    drop_id: "drop",
    status: "ACTIVE",
    competition_id: "comp",
    wave_id: "wave",
    submitter: { id: "author", handle: "Alice" },
  },
  vote_summary: {
    rating: 39,
    realtime_rating: 42,
    rating_prediction: 42,
    rank: 1,
    raters_count: 1,
    user_vote: 20,
    top_raters: [],
    over_threshold_since_ms: 100,
  },
};
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(
    () => useCompetitionEntryDrops([{ entryId: "entry", dropId: "drop" }]),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchCompetitionEntryDrop).mockResolvedValue({
    ...context,
    awards: [],
    original: {
      id: "drop",
      author: context.entry.submitter,
      wave: { id: "wave" },
      parts: [{ content: "Immutable art" }],
      context_profile_context: { rating: 0 },
    },
  } as never);
});
it("hydrates rich cards with competition totals and approval timing", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true));
  expect(result.current[0]?.data?.drop).toMatchObject({
    competition_id: "comp",
    competition_context: {
      viewer: "viewer:self",
      waveId: "wave",
      dropId: "drop",
      data: context,
    },
    rating: 39,
    over_threshold_since_ms: 100,
    context_profile_context: { rating: 20 },
    parts: [{ content: "Immutable art" }],
  });
});
it("does not render entries omitted by the scoped batch endpoint", async () => {
  jest.mocked(fetchCompetitionEntryDrop).mockResolvedValue(null);
  const { result } = setup();
  await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true));
  expect(result.current[0]?.data).toBeNull();
});

it("preserves scoped awards on hydrated winner cards", async () => {
  const award = {
    id: "award",
    decision_id: "decision",
    entry_id: "entry",
    outcome_position: 0,
    type: "MANUAL",
    description: "Minted on The Memes",
    credit: null,
    rep_category: null,
    amount: null,
  };
  jest.mocked(fetchCompetitionEntryDrop).mockResolvedValue({
    ...context,
    entry: {
      ...context.entry,
      status: "WINNER",
      rank: 1,
      won_at: 100,
      decision_id: "decision",
    },
    awards: [award],
    original: {
      id: "drop",
      author: context.entry.submitter,
      wave: { id: "wave" },
      parts: [],
    },
  } as never);
  const { result } = setup();
  await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true));
  expect(result.current[0]?.data?.drop.winning_context?.awards).toEqual([
    { type: "MANUAL", description: "Minted on The Memes" },
  ]);
});
