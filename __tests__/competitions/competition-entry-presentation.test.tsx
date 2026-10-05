import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { fetchDropCompetitionContext } from "@/services/api/competitions-api";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";

jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({ competition: { id: "comp", wave_id: "wave" } }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/services/api/competitions-api", () => ({
  ...jest.requireActual("@/services/api/competitions-api"),
  fetchDropCompetitionContext: jest.fn(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropV2ById: jest.fn(),
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
  jest.mocked(fetchDropCompetitionContext).mockResolvedValue(context as never);
  jest.mocked(fetchDropV2ById).mockResolvedValue({
    id: "drop",
    wave: { id: "wave" },
    parts: [{ content: "Immutable art" }],
    context_profile_context: { rating: 0 },
  } as never);
});
it("hydrates rich cards with competition totals and approval timing", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true));
  expect(result.current[0]?.data?.drop).toMatchObject({
    competition_id: "comp",
    rating: 39,
    over_threshold_since_ms: 100,
    context_profile_context: { rating: 20 },
    parts: [{ content: "Immutable art" }],
  });
});
it("never hydrates content belonging to another competition", async () => {
  jest.mocked(fetchDropCompetitionContext).mockResolvedValue({
    ...context,
    competition: { ...context.competition, id: "other" },
  } as never);
  const { result } = setup();
  await waitFor(() => expect(result.current[0]?.isError).toBe(true));
  expect(fetchDropV2ById).not.toHaveBeenCalled();
});
it("does not render deleted entries", async () => {
  jest
    .mocked(fetchDropCompetitionContext)
    .mockResolvedValue({ competition: null, entry: null });
  const { result } = setup();
  await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true));
  expect(result.current[0]?.data).toBeNull();
  expect(fetchDropV2ById).not.toHaveBeenCalled();
});
