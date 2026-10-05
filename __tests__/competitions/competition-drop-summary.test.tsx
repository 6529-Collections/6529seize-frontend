import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCompetitionDrop,
  applyCompetitionDropSummary,
} from "@/hooks/competitions/useCompetitionDrop";
import {
  fetchDropCompetitionContext,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiDropCompetitionContext } from "@/generated/models/ApiDropCompetitionContext";
import type { ReactNode } from "react";

jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/services/api/competitions-api", () => ({
  ...jest.requireActual("@/services/api/competitions-api"),
  fetchDropCompetitionContext: jest.fn(),
}));
const drop = {
  id: "drop",
  wave: { id: "wave", voting_credit_type: "TDH" },
  rating: 0,
  raters_count: 0,
  top_raters: [],
  context_profile_context: { rating: 0, reaction: "heart" },
} as unknown as ExtendedDrop;
const context = {
  competition: {
    id: "competition",
    wave_id: "wave",
    voting: {
      credit_type: "TDH_PLUS_XTDH",
      credit_scope: "WAVE",
      starts_at: 1,
      ends_at: 9999999999999,
    },
  },
  entry: { id: "entry" },
  vote_summary: {
    rating: 120,
    realtime_rating: 200,
    rating_prediction: 200,
    raters_count: 2,
    user_vote: -30,
    rank: 4,
    top_raters: [{ rating: 230, profile: { id: "voter" } }],
  },
} as ApiDropCompetitionContext;

it("projects competition totals, current user vote, rank and credit type into the existing card fields", () => {
  const result = applyCompetitionDropSummary(drop, context);
  expect(result).toMatchObject({
    rating: 120,
    realtime_rating: 200,
    rating_prediction: 200,
    raters_count: 2,
    rank: 4,
    competition_id: "competition",
    context_profile_context: { rating: -30, reaction: "heart" },
    wave: { id: "wave", voting_credit_type: "TDH_PLUS_XTDH" },
  });
  expect(result.top_raters).toEqual(context.vote_summary?.top_raters);
  expect(drop.rating).toBe(0);
});
it("preserves the old rendering data when there is no native competition", () => {
  expect(
    applyCompetitionDropSummary(drop, { competition: null, entry: null })
  ).toBe(drop);
});
it("refreshes the card when competition votes are invalidated", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  jest.mocked(fetchDropCompetitionContext).mockResolvedValue(context);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCompetitionDrop(drop), { wrapper });
  await waitFor(() => expect(result.current.rating).toBe(120));
  jest.mocked(fetchDropCompetitionContext).mockResolvedValue({
    ...context,
    vote_summary: { ...context.vote_summary!, rating: 250, user_vote: 100 },
  });
  await invalidateCompetition(client, {
    waveId: "wave",
    competitionId: "competition",
  });
  await waitFor(() => expect(result.current.rating).toBe(250));
  expect(result.current.context_profile_context?.rating).toBe(100);
});
