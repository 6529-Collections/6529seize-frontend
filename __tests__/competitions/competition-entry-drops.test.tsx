import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { fetchCompetitionEntryDrop } from "@/services/api/competition-entry-drops-api";

jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: {
      id: "competition",
      wave_id: "wave",
      permissions: { vote: true },
    },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/services/api/competitions-api", () => ({
  competitionScope: () => ({ wave_id: "wave", competition_id: "competition" }),
}));

jest.mock("@/services/api/competition-entry-drops-api", () => ({
  fetchCompetitionEntryDrop: jest.fn(),
}));

it("aborts offscreen queued context lookups after a fast virtual range jump", async () => {
  const signals = new Map<string, AbortSignal>();
  jest
    .mocked(fetchCompetitionEntryDrop)
    .mockImplementation((_identity, _viewer, _entryId, dropId, signal) => {
      signals.set(dropId, signal!);
      return new Promise(() => undefined);
    });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const refs = (id: string) => [{ entryId: `entry-${id}`, dropId: id }];
  const { rerender, unmount } = renderHook(
    ({ entries }) => useCompetitionEntryDrops(entries),
    {
      initialProps: { entries: [...refs("old-a"), ...refs("old-b")] },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
  await waitFor(() => expect(signals.size).toBe(2));
  rerender({ entries: refs("visible") });
  await waitFor(() => expect(signals.get("visible")).toBeDefined());
  expect(signals.get("old-a")?.aborted).toBe(true);
  expect(signals.get("old-b")?.aborted).toBe(true);
  expect(signals.get("visible")?.aborted).toBe(false);
  unmount();
  expect(signals.get("visible")?.aborted).toBe(true);
  client.clear();
});
