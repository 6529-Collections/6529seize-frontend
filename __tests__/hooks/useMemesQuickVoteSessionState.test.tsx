import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiUndiscoveredDrop } from "@/generated/models/ApiUndiscoveredDrop";
import {
  getMemesQuickVoteUndiscoveredDropQueryKey,
  updateMemesQuickVoteCachedDrop,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteSessionState } from "@/hooks/useMemesQuickVoteSessionState";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const fetchMock = jest.fn() as jest.MockedFunction<
  (request: {
    endpoint: string;
    params?: Record<string, string> | undefined;
    signal?: AbortSignal | undefined;
  }) => Promise<ApiUndiscoveredDrop>
>;
const drop = (id: string, rating = 0) =>
  ({
    id,
    wave: { id: "memes" },
    context_profile_context: { rating, max_rating: 1000, min_rating: 0 },
  }) as ApiDrop;
const response = (id: string | null, count = 10): ApiUndiscoveredDrop => ({
  drop: id ? drop(id) : null,
  total_count: count,
  left_to_vote_in_current_round: count,
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
function setup(seed?: ApiUndiscoveredDrop, updatedAt = Date.now()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  if (seed)
    client.setQueryData(
      getMemesQuickVoteUndiscoveredDropQueryKey({
        contextProfile: "voter",
        proxyId: null,
        sessionId: 0,
        skip: 0,
        waveId: "memes",
      }),
      seed,
      { updatedAt }
    );
  const pendingDropIdsRef = { current: [] as string[] };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const initialProps: { profile?: string; enabled?: boolean } = {};
  const hook = renderHook(
    ({ profile = "voter", enabled = true }: typeof initialProps) =>
      useMemesQuickVoteSessionState({
        contextProfile: profile,
        enabled,
        isQuickVoteEnabled: true,
        isSettingsLoaded: true,
        pendingDropIdsRef,
        proxyId: null,
        stateKey: profile,
        waveId: "memes",
      }),
    { wrapper, initialProps }
  );
  return { ...hook, client, pendingDropIdsRef };
}

// Reuse single-candidate fixtures while modeling the server's ordered batch envelope.
// Physical request fanout is covered independently by the queue batching test.
beforeEach(() => {
  (commonApiFetch as jest.Mock).mockImplementation(
    async (request: Parameters<typeof fetchMock>[0]) => {
      if (!request.endpoint.endsWith("/undiscovered-drops"))
        return fetchMock(request);
      const skip = Number(request.params?.["skip"] ?? 0);
      const limit = Number(request.params?.["limit"] ?? 4);
      const responses = await Promise.all(
        Array.from({ length: limit }, (_, index) =>
          fetchMock({ ...request, params: { skip: `${skip + index}` } })
        )
      );
      return {
        drops: responses.flatMap((item) => (item.drop ? [item.drop] : [])),
        total_count: responses[0]?.total_count ?? 0,
        left_to_vote_in_current_round:
          responses[0]?.left_to_vote_in_current_round ?? 0,
      };
    }
  );
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

it("renders the footer's cached first drop immediately and fetches only lookahead", async () => {
  const background = deferred<ApiUndiscoveredDrop>();
  fetchMock.mockReturnValue(background.promise);
  const { result, unmount } = setup(response("first"));
  expect(result.current.sessionState.currentDrop?.id).toBe("first");
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(
    fetchMock.mock.calls.map(([request]) => request.params?.["skip"])
  ).toEqual(["1", "2", "3"]);
  unmount();
});

it("publishes the first response without waiting for lookahead and retains it after a background failure", async () => {
  const background = deferred<ApiUndiscoveredDrop>();
  fetchMock.mockImplementation(({ params }) =>
    params?.["skip"] ? background.promise : Promise.resolve(response("first"))
  );
  const { result } = setup();
  await waitFor(() =>
    expect(result.current.sessionState.currentDrop?.id).toBe("first")
  );
  await act(async () => background.reject(new Error("lookahead failed")));
  expect(result.current.sessionState.currentDrop?.id).toBe("first");
  expect(result.current.sessionState.hasDiscoveryError).toBe(false);
});

it("uses a successful lookahead even when the primary request fails", async () => {
  fetchMock.mockImplementation(({ params }) =>
    params?.["skip"]
      ? Promise.resolve(response(`next-${params["skip"]}`))
      : Promise.reject(new Error("primary failed"))
  );
  const { result } = setup();
  await waitFor(() =>
    expect(result.current.sessionState.currentDrop).not.toBeNull()
  );
  expect(result.current.sessionState.hasDiscoveryError).toBe(false);
});

it("shows the existing retry state when every discovery request fails", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));
  const { result } = setup();
  await waitFor(() =>
    expect(result.current.sessionState.hasDiscoveryError).toBe(true)
  );
  expect(result.current.sessionState.currentDrop).toBeNull();
});

it("does not seed a known-rated footer drop", async () => {
  const background = deferred<ApiUndiscoveredDrop>();
  fetchMock.mockReturnValue(background.promise);
  const { result, unmount } = setup({
    ...response("rated"),
    drop: drop("rated", 100),
  });
  expect(result.current.sessionState.currentDrop).toBeNull();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(result.current.sessionState.currentDrop).toBeNull();
  unmount();
});

it("does not expose the previous profile's buffered drop", async () => {
  const background = deferred<ApiUndiscoveredDrop>();
  fetchMock.mockReturnValue(background.promise);
  const { result, rerender, unmount } = setup(response("first"));
  rerender({ profile: "other", enabled: true });
  expect(result.current.sessionState.currentDrop).toBeNull();
  unmount();
});

it("keeps the queue on close and reopen without fetching another full window", async () => {
  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`drop-${params?.["skip"] ?? 0}`))
  );
  const { result, rerender } = setup(response("drop-0"));
  await waitFor(() =>
    expect(result.current.sessionState.lookaheadDrops).toHaveLength(3)
  );
  const before = fetchMock.mock.calls.length;
  rerender({ enabled: false });
  expect(result.current.sessionState.currentDrop?.id).toBe("drop-0");
  rerender({ enabled: true });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(fetchMock).toHaveBeenCalledTimes(before);
  expect(result.current.sessionState.lookaheadDrops).toHaveLength(3);
});

it("refills only the missing slots after advancing", async () => {
  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`drop-${params?.["skip"] ?? 0}`))
  );
  const { result } = setup(response("drop-0"));
  await waitFor(() =>
    expect(result.current.sessionState.lookaheadDrops).toHaveLength(3)
  );
  act(() =>
    result.current.advanceVisibleDrop(
      result.current.sessionState.currentDrop as ExtendedDrop,
      true
    )
  );
  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`drop-${Number(params?.["skip"] ?? 0) + 1}`, 9))
  );
  await act(async () => result.current.syncUndiscoveredWindow());
  expect(result.current.sessionState.currentDrop?.id).toBe("drop-1");
  expect(
    result.current.sessionState.lookaheadDrops.map((item) => item.id)
  ).toEqual(["drop-2", "drop-3", "drop-4"]);
  expect(
    fetchMock.mock.calls.slice(3).map(([request]) => request.params?.["skip"])
  ).toEqual([undefined, "3"]);
  expect(result.current.sessionState.unratedCount).toBe(9);
});

it("does not undo a vote's counts when older lookahead responses arrive", async () => {
  const slow = deferred<ApiUndiscoveredDrop>();
  fetchMock.mockReturnValue(slow.promise);
  const { result } = setup(response("first", 3));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  act(() =>
    result.current.advanceVisibleDrop(
      result.current.sessionState.currentDrop as ExtendedDrop,
      true
    )
  );
  expect(result.current.sessionState.unratedCount).toBe(2);
  await act(async () => slow.resolve(response("second", 3)));
  expect(result.current.sessionState.unratedCount).toBe(2);
  expect(result.current.sessionState.leftThisRoundCount).toBe(2);
});

it("retires a buffered drop when another voting surface updates its cached rating", async () => {
  const slow = deferred<ApiUndiscoveredDrop>();
  fetchMock.mockReturnValue(slow.promise);
  const { result, client, unmount } = setup(response("first"));
  act(() =>
    client.setQueryData(
      getMemesQuickVoteUndiscoveredDropQueryKey({
        contextProfile: "voter",
        proxyId: null,
        waveId: "memes",
        sessionId: 0,
        skip: 0,
      }),
      { ...response("first"), drop: drop("first", 100) }
    )
  );
  expect(result.current.sessionState.currentDrop).toBeNull();
  expect(result.current.sessionState.unratedCount).toBe(9);
  unmount();
});

it("shows all done after an empty successful window", async () => {
  fetchMock.mockResolvedValue(response(null, 0));
  const { result } = setup();
  await waitFor(() =>
    expect(result.current.sessionState.isExhausted).toBe(true)
  );
  expect(result.current.sessionState.hasDiscoveryError).toBe(false);
});

it("allows a restart request to finish after the old three-second deadline", async () => {
  jest.useFakeTimers();
  const slow = deferred<ApiUndiscoveredDrop>();
  let requests = 0;
  fetchMock.mockImplementation(() =>
    ++requests <= 4
      ? Promise.resolve({
          ...response(null, 2),
          left_to_vote_in_current_round: 0,
        })
      : slow.promise
  );
  const { result } = setup();
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1);
  });
  expect(result.current.sessionState.isRestartingRound).toBe(true);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(8_500);
  });
  expect(result.current.sessionState.hasDiscoveryError).toBe(false);
  await act(async () => slow.resolve(response("restarted", 2)));
  expect(result.current.sessionState.currentDrop?.id).toBe("restarted");
  expect(result.current.sessionState.isRestartingRound).toBe(false);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1_000);
  });
  expect(fetchMock).toHaveBeenCalledTimes(8);
});

it("shows all done when the server reports no voting power", async () => {
  fetchMock.mockResolvedValue({
    ...response("no-power"),
    drop: {
      ...drop("no-power"),
      context_profile_context: {
        ...drop("no-power").context_profile_context!,
        max_rating: 0,
        min_rating: 0,
      },
    },
  });
  const { result } = setup();
  await waitFor(() =>
    expect(result.current.sessionState.isExhausted).toBe(true)
  );
  expect(result.current.sessionState.currentDrop).toBeNull();
});

it("ignores an old submission callback while the dialog is closed", async () => {
  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`drop-${params?.["skip"] ?? 0}`))
  );
  const { result, rerender } = setup(response("drop-0"));
  await waitFor(() =>
    expect(result.current.sessionState.lookaheadDrops).toHaveLength(3)
  );
  const syncAfterSubmission = result.current.syncUndiscoveredWindow;
  const before = fetchMock.mock.calls.length;
  rerender({ enabled: false });
  await act(async () => syncAfterSubmission());
  expect(fetchMock).toHaveBeenCalledTimes(before);
});

it("clears cached candidates when the server reports no unrated drops", async () => {
  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`drop-${params?.["skip"] ?? 0}`))
  );
  const { result } = setup(response("drop-0"));
  await waitFor(() =>
    expect(result.current.sessionState.lookaheadDrops).toHaveLength(3)
  );
  fetchMock.mockResolvedValue(response(null, 0));
  await act(async () => result.current.syncUndiscoveredWindow());
  expect(result.current.sessionState.isExhausted).toBe(true);
  expect(result.current.sessionState.currentDrop).toBeNull();
  expect(result.current.sessionState.lookaheadDrops).toEqual([]);
});

it("limits other-surface rating updates to the authenticated profile cache", () => {
  const client = new QueryClient();
  const key = (contextProfile: string, proxyId: string | null = null) =>
    getMemesQuickVoteUndiscoveredDropQueryKey({
      contextProfile,
      proxyId,
      sessionId: 0,
      skip: 0,
      waveId: "memes",
    });
  for (const cacheKey of [key("voter"), key("other"), key("voter", "proxy")]) {
    client.setQueryData(cacheKey, response("first"));
  }
  updateMemesQuickVoteCachedDrop(client, drop("first", 100), "voter");
  expect(
    client.getQueryData<ApiUndiscoveredDrop>(key("voter"))?.drop
      ?.context_profile_context?.rating
  ).toBe(100);
  expect(
    client.getQueryData<ApiUndiscoveredDrop>(key("other"))?.drop
      ?.context_profile_context?.rating
  ).toBe(0);
  expect(
    client.getQueryData<ApiUndiscoveredDrop>(key("voter", "proxy"))?.drop
      ?.context_profile_context?.rating
  ).toBe(0);
  client.clear();
});

it("normalizes cache profile keys and invalidates a retired footer candidate", () => {
  const client = new QueryClient();
  const key = getMemesQuickVoteUndiscoveredDropQueryKey({
    contextProfile: " voter ",
    proxyId: null,
    sessionId: 0,
    skip: 0,
    waveId: "memes",
  });
  client.setQueryData(key, response("first"));
  updateMemesQuickVoteCachedDrop(client, drop("first", 100), "voter");
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(
    client.getQueryData<ApiUndiscoveredDrop>(key)?.drop?.context_profile_context
      ?.rating
  ).toBe(100);
  client.clear();
});

it("waits for a fresh candidate when the footer cache is older than a minute", async () => {
  const background = deferred<ApiUndiscoveredDrop>();
  fetchMock.mockReturnValue(background.promise);
  const { result, unmount } = setup(response("old"), Date.now() - 60_001);
  expect(result.current.sessionState.currentDrop).toBeNull();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  await act(async () => background.resolve(response("fresh")));
  expect(result.current.sessionState.currentDrop?.id).toBe("fresh");
  unmount();
});

it("expires a closed buffer without issuing background requests and refreshes on reopen", async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`old-${params?.["skip"] ?? 0}`))
  );
  const { result, rerender } = setup(response("old-0"));
  await act(async () => jest.advanceTimersByTimeAsync(1));
  expect(result.current.sessionState.lookaheadDrops).toHaveLength(3);
  rerender({ enabled: false });
  const calls = fetchMock.mock.calls.length;
  await act(async () => jest.advanceTimersByTimeAsync(60_001));
  expect(fetchMock).toHaveBeenCalledTimes(calls);
  expect(result.current.sessionState.currentDrop).toBeNull();
  expect(result.current.sessionState.lookaheadDrops).toEqual([]);

  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`fresh-${params?.["skip"] ?? 0}`))
  );
  rerender({ enabled: true });
  await act(async () => jest.advanceTimersByTimeAsync(1));
  expect(result.current.sessionState.currentDrop?.id).toBe("fresh-0");
  expect(fetchMock).toHaveBeenCalledTimes(calls + 4);
});

it("keeps the visible candidate stable while the ordered background batch is pending", async () => {
  const pending = Array.from({ length: 3 }, () =>
    deferred<ApiUndiscoveredDrop>()
  );
  fetchMock.mockImplementation(
    ({ params }) => pending[Number(params?.["skip"]) - 1]!.promise
  );
  const { result } = setup(response("first"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  await act(async () => pending[2]!.resolve(response("third")));
  expect(result.current.sessionState.currentDrop?.id).toBe("first");
  expect(result.current.sessionState.lookaheadDrops).toEqual([]);
  await act(async () => pending[0]!.resolve(response("second")));
  await act(async () => pending[1]!.resolve(response("second")));
  expect(result.current.sessionState.currentDrop?.id).toBe("first");
  expect(
    result.current.sessionState.lookaheadDrops.map((candidate) => candidate.id)
  ).toEqual(["second", "third"]);
  act(() => result.current.advanceVisibleDrop(drop("first") as ExtendedDrop));
  expect(result.current.sessionState.currentDrop?.id).toBe("second");
});

it("keeps the retained buffer bounded when the refreshed primary is a new submission", async () => {
  fetchMock.mockImplementation(({ params }) =>
    Promise.resolve(response(`drop-${params?.["skip"] ?? 0}`))
  );
  const { result } = setup(response("drop-0"));
  await waitFor(() =>
    expect(result.current.sessionState.lookaheadDrops).toHaveLength(3)
  );
  fetchMock.mockResolvedValue(response("newest"));
  await act(async () => result.current.syncUndiscoveredWindow());
  expect(result.current.sessionState.currentDrop?.id).toBe("drop-0");
  expect(
    result.current.sessionState.lookaheadDrops.map((candidate) => candidate.id)
  ).toEqual(["drop-1", "drop-2", "drop-3"]);
});
