import { render, renderHook, screen, waitFor } from "@testing-library/react";
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
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { SingleWaveDrop } from "@/components/waves/drop/SingleWaveDrop";

jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => true,
}));
jest.mock(
  "@/components/waves/drops/participation/participationRendererRegistry",
  () => ({
    useWaveParticipationRendererSet: () => ({
      SingleWaveDrop: ({ drop: renderedDrop }: { drop: ExtendedDrop }) => (
        <div>
          {renderedDrop.drop_type} {renderedDrop.rating}
        </div>
      ),
    }),
  })
);

jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/services/api/competitions-api", () => ({
  ...jest.requireActual("@/services/api/competitions-api"),
  fetchDropCompetitionContext: jest.fn(),
}));
const drop = {
  id: "drop",
  drop_type: "CHAT",
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
  entry: {
    id: "entry",
    wave_id: "wave",
    competition_id: "competition",
    drop_id: "drop",
    status: "ACTIVE",
    submitted_at: 10,
    rank: null,
    won_at: null,
  },
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
    drop_type: "PARTICIPATORY",
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
it("uses scoped winner state when the frozen old GET still describes shared chat content", () => {
  expect(
    applyCompetitionDropSummary(drop, {
      ...context,
      entry: {
        ...context.entry!,
        status: ApiCompetitionEntryStatus.Winner,
        rank: 2,
        won_at: 99,
      },
    })
  ).toMatchObject({
    drop_type: "WINNER",
    winning_context: { place: 2, decision_time: 99 },
  });
});
it("preserves the original primary winner awards supplied by the frozen GET", () => {
  const winner = {
    ...drop,
    winning_context: {
      place: 2,
      decision_time: 99,
      awards: [{ description: "Original award" }],
    },
  } as unknown as ExtendedDrop;
  const result = applyCompetitionDropSummary(winner, {
    ...context,
    entry: { ...context.entry!, status: ApiCompetitionEntryStatus.Winner },
  });
  expect(result.winning_context).toBe(winner.winning_context);
});
it.each([
  { rank: null, won_at: 99 },
  { rank: 2, won_at: null },
  { rank: 0, won_at: 99 },
])("keeps CHAT when winner provenance is incomplete (%s)", (provenance) => {
  expect(
    applyCompetitionDropSummary(drop, {
      ...context,
      entry: {
        ...context.entry!,
        status: ApiCompetitionEntryStatus.Winner,
        ...provenance,
      },
    })
  ).toBe(drop);
});
it("clears stale winner presentation when the scoped entry is active", () => {
  const formerWinner = {
    ...drop,
    winning_context: { place: 1, decision_time: 99, awards: [] },
  } as ExtendedDrop;
  expect(
    applyCompetitionDropSummary(formerWinner, context).winning_context
  ).toBeUndefined();
});
it("never promotes CHAT from another competition, wave, drop or an absent entry", () => {
  for (const entry of [
    null,
    { ...context.entry!, drop_id: "other" },
    { ...context.entry!, wave_id: "other" },
    { ...context.entry!, competition_id: "other" },
  ]) {
    expect(applyCompetitionDropSummary(drop, { ...context, entry })).toBe(drop);
  }
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
it("resolves scoped submission data before rendering a drop deep link", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  jest.mocked(fetchDropCompetitionContext).mockResolvedValue(context);
  render(
    <QueryClientProvider client={client}>
      <SingleWaveDrop drop={drop} onClose={jest.fn()} />
    </QueryClientProvider>
  );
  expect(await screen.findByText("PARTICIPATORY 120")).toBeInTheDocument();
});
