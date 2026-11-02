import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import {
  competitionCardDrop,
  fetchCompetitionEntryDrop,
} from "@/services/api/competition-entry-drops-api";
import type { ApiCompetitionEntryContext } from "@/generated/models/ApiCompetitionEntryContext";

jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: {
      id: "competition",
      wave_id: "wave",
      permissions: { vote: true },
      voting: { credit_type: "TDH", credit_scope: "WAVE" },
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
  competitionCardDrop: jest.fn(
    (context: ApiCompetitionEntryContext) => context.drop
  ),
}));

beforeEach(() => jest.clearAllMocks());

it("renders embedded cards without another request, accepts page updates and clears omitted content", async () => {
  const client = new QueryClient();
  const context = {
    entry: {
      id: "entry",
      drop_id: "drop",
      wave_id: "wave",
      competition_id: "competition",
      status: "ACTIVE",
      submitter: { id: "author", handle: "Alice" },
    },
    drop: {
      id: "drop",
      author: { id: "author", handle: "Alice" },
      wave: { id: "wave" },
      title: "Loaded artwork",
    },
    awards: [],
    vote_summary: { rating: 10, user_vote: 2 },
  } as unknown as ApiCompetitionEntryContext;
  const { result, rerender, unmount } = renderHook(
    ({ contexts, updatedAt }) =>
      useCompetitionEntryDrops([{ entryId: "entry", dropId: "drop" }], {
        contexts,
        updatedAt,
      }),
    {
      initialProps: { contexts: [context], updatedAt: Date.now() },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
  expect(result.current[0]?.data?.drop.title).toBe("Loaded artwork");
  expect(fetchCompetitionEntryDrop).not.toHaveBeenCalled();
  rerender({
    contexts: [
      { ...context, vote_summary: { ...context.vote_summary, rating: 20 } },
    ],
    updatedAt: Date.now() + 100,
  });
  await waitFor(() => expect(result.current[0]?.data?.drop.rating).toBe(20));
  const [query] = client.getQueryCache().getAll();
  const confirmed = result.current[0]!.data!;
  act(() => {
    client.setQueryData(
      query!.queryKey,
      {
        ...confirmed,
        drop: { ...confirmed.drop, rating: 30 },
      },
      { updatedAt: Date.now() + 300 }
    );
  });
  rerender({ contexts: [context], updatedAt: Date.now() + 200 });
  await waitFor(() => expect(result.current[0]?.data?.drop.rating).toBe(30));
  expect(fetchCompetitionEntryDrop).not.toHaveBeenCalled();
  let complete!: (
    value: Awaited<ReturnType<typeof fetchCompetitionEntryDrop>>
  ) => void;
  jest.mocked(fetchCompetitionEntryDrop).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  let refreshing!: Promise<unknown>;
  act(() => {
    refreshing = result.current[0]!.refetch();
  });
  rerender({ contexts: [], updatedAt: Date.now() + 400 });
  await waitFor(() => expect(result.current[0]?.data).toBeNull());
  await act(async () => {
    complete({
      ...context,
      original: confirmed.drop,
      competition: confirmed.drop.competition_context!.data.competition!,
    });
    await refreshing;
  });
  expect(result.current[0]?.data).toBeNull();
  unmount();
  client.clear();
});

it.each(["parent", "content"])(
  "ignores an invalid embedded %s without crashing",
  (kind) => {
    const client = new QueryClient();
    const context = {
      entry: {
        id: "entry",
        competition_id: kind === "parent" ? "wrong" : "competition",
      },
    } as ApiCompetitionEntryContext;
    if (kind === "content")
      jest.mocked(competitionCardDrop).mockImplementationOnce(() => {
        throw new Error("Invalid competition card");
      });
    const { result, unmount } = renderHook(
      () =>
        useCompetitionEntryDrops([{ entryId: "entry", dropId: "drop" }], {
          contexts: [context],
          updatedAt: Date.now(),
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      }
    );
    expect(result.current[0]?.data).toBeNull();
    expect(fetchCompetitionEntryDrop).not.toHaveBeenCalled();
    unmount();
    client.clear();
  }
);

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
