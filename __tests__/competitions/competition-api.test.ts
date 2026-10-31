import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  competitionQueryKey,
  competitionScope,
  fetchCompetition,
  fetchCompetitionHub,
  fetchDefaultCompetition,
  fetchCompetitionPauseState,
  fetchCompetitions,
  invalidateCompetition,
  invalidateCompetitionWave,
  setCompetitionVote,
} from "@/services/api/competitions-api";
import { commonApiFetch, commonApiPut } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiPatch: jest.fn(),
  commonApiPut: jest.fn(),
}));
const identity = { waveId: "wave", competitionId: "one" };
const other = { waveId: "wave", competitionId: "two" };

describe("explicit competition transport", () => {
  beforeEach(() => jest.clearAllMocks());
  it("requests authoritative default selection with cancellation and structured errors", async () => {
    const signal = new AbortController().signal;
    await fetchDefaultCompetition("wave/encoded", signal);
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "v3/waves/wave%2Fencoded/default-competition",
      signal,
      errorMode: "structured",
    });
  });
  it("rejects a mismatched parent rather than rendering another competition", async () => {
    jest
      .mocked(commonApiFetch)
      .mockResolvedValueOnce({ id: "one", wave_id: "different" });
    await expect(fetchCompetition(identity)).rejects.toThrow(
      "Invalid competition parent"
    );
    jest.mocked(commonApiFetch).mockResolvedValueOnce({ id: "different" });
    await expect(fetchCompetitionHub("wave")).rejects.toThrow(
      "Invalid competition parent"
    );
  });
  it("isolates resource caches by competition and viewer and leaves shared drops untouched", async () => {
    const client = new QueryClient();
    const keys = [
      competitionQueryKey(identity, "alice"),
      competitionQueryKey(identity, "bob"),
      competitionQueryKey(other, "alice"),
      [
        QueryKey.COMPETITION_RESOURCE,
        { ...competitionScope(identity), viewer: "alice" },
        "entries",
      ],
      [QueryKey.DROPS, { waveId: "wave" }],
      [QueryKey.DROPS_LEADERBOARD, { waveId: "wave", sort: "RANK" }],
      [QueryKey.DROPS_LEADERBOARD, { waveId: "elsewhere", sort: "RANK" }],
    ];
    keys.forEach((key) => client.setQueryData(key, { value: true }));
    await invalidateCompetition(client, identity);
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual(
      [true, true, false, true, false, true, false]
    );
  });
  it("resolves an active decision pause beyond the first history page", async () => {
    const now = Date.now();
    jest
      .mocked(commonApiFetch)
      .mockResolvedValueOnce({
        data: Array.from({ length: 100 }, (_, id) => ({
          id: String(id),
          start_time: now + 1000,
          end_time: now + 2000,
        })),
        has_more: true,
        next_cursor: "older",
      })
      .mockResolvedValueOnce({
        data: [{ id: "active", start_time: now - 1000, end_time: null }],
        has_more: false,
        next_cursor: null,
      });
    await expect(fetchCompetitionPauseState(identity)).resolves.toBe(true);
    expect(commonApiFetch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        params: { limit: "100", direction: "DESC", cursor: "older" },
      })
    );
  });
  it("refreshes a wave batch once per active query and leaves other waves fresh", async () => {
    const client = new QueryClient();
    const keys = [
      competitionQueryKey(identity, "alice"),
      competitionQueryKey(other, "bob"),
      [
        QueryKey.COMPETITION_RESOURCE,
        { ...competitionScope(identity), viewer: "alice" },
        "entries",
      ],
      [QueryKey.COMPETITION_CREDITS, competitionScope(other)],
      [QueryKey.COMPETITION_HUB, { wave_id: "wave" }],
      [QueryKey.COMPETITIONS, { wave_id: "wave", filter: "active" }],
      [QueryKey.DEFAULT_COMPETITION, { wave_id: "wave", viewer: "alice" }],
      [QueryKey.DEFAULT_COMPETITION, { wave_id: "elsewhere", viewer: "alice" }],
      competitionQueryKey(
        { waveId: "elsewhere", competitionId: "one" },
        "alice"
      ),
      [QueryKey.DROPS, { waveId: "wave" }],
    ];
    keys.forEach((key) => client.setQueryData(key, { value: true }));
    await invalidateCompetitionWave(client, "wave");
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual(
      [true, true, true, true, true, true, true, false, false, false]
    );
  });
  it("refetches each active leaderboard sort once without fetching inactive sorts or other waves", async () => {
    const client = new QueryClient();
    const keys = [
      [QueryKey.DROPS_LEADERBOARD, { waveId: "wave", sort: "RANK" }],
      [QueryKey.DROPS_LEADERBOARD, { waveId: "wave", sort: "CREATED_AT" }],
      [QueryKey.DROPS_LEADERBOARD, { waveId: "wave", sort: "TREND" }],
      [QueryKey.DROPS_LEADERBOARD, { waveId: "elsewhere", sort: "RANK" }],
    ];
    const queries = keys.map((queryKey) => ({
      queryKey,
      queryFn: jest.fn(async () => ({ value: "fresh" })),
    }));
    const unsubscribe = queries.flatMap(({ queryKey, queryFn }, index) => {
      client.setQueryData(queryKey, { value: "cached" });
      client.setQueryDefaults(queryKey, { queryFn });
      // The third sort exists only in cache; all others have mounted observers.
      if (index === 2) return [];
      const observer = new QueryObserver(client, {
        queryKey,
        queryFn,
        staleTime: Infinity,
      });
      return [observer.subscribe(() => {})];
    });
    try {
      await invalidateCompetitionWave(client, "wave");
      expect(queries.map(({ queryFn }) => queryFn.mock.calls.length)).toEqual([
        1, 1, 0, 0,
      ]);
      expect(client.getQueryState(keys[2]!)?.isInvalidated).toBe(true);
      expect(client.getQueryState(keys[3]!)?.isInvalidated).toBe(false);
    } finally {
      unsubscribe.forEach((stop) => stop());
      client.clear();
    }
  });
  it("does not report unpaused when pause history cannot be resolved", async () => {
    jest
      .mocked(commonApiFetch)
      .mockResolvedValue({ data: [], has_more: true, next_cursor: "repeated" });
    await expect(fetchCompetitionPauseState(identity)).rejects.toThrow(
      "Invalid pause history cursor"
    );
  });
  it("bounds pause history with changing cursors to one hundred pages", async () => {
    for (let page = 0; page < 100; page++) {
      jest.mocked(commonApiFetch).mockResolvedValueOnce({
        data: [],
        has_more: true,
        next_cursor: `page-${page}`,
      });
    }
    await expect(fetchCompetitionPauseState(identity)).rejects.toThrow(
      "Pause history could not be resolved"
    );
    expect(commonApiFetch).toHaveBeenCalledTimes(100);
  });
  it("requests historical phases on the server before cursor pagination", async () => {
    jest
      .mocked(commonApiFetch)
      .mockResolvedValue({ data: [], has_more: false, next_cursor: null });
    await fetchCompetitions("wave", "history-cursor", undefined, "history");
    const endpoint = jest.mocked(commonApiFetch).mock.calls[0]![0].endpoint;
    const query = new URL(endpoint, "https://example.test/").searchParams;
    expect(query.getAll("phase")).toEqual([
      "COMPLETED",
      "CANCELLED",
      "ARCHIVED",
    ]);
    expect(query.get("cursor")).toBe("history-cursor");
  });
  it("sends the original signed idempotent vote body to the entry-scoped command", async () => {
    const body = {
      idempotency_key: "request",
      config_version: 2,
      value: -4,
      signature: { message: "message", signature: "0xsig" },
    };
    await setCompetitionVote(identity, "entry", body);
    expect(commonApiPut).toHaveBeenCalledWith({
      endpoint: "v3/waves/wave/competitions/one/entries/entry/votes/me",
      body,
      errorMode: "structured",
    });
  });
});
