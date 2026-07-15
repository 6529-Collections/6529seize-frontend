jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

const mockFetchWaveDropsFeedV2 = jest.fn();
const mockTraceServerRouteData = jest.fn(
  async (_options: unknown, task: () => Promise<unknown>) => task()
);

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchWaveDropsFeedV2: (...args: unknown[]) =>
    mockFetchWaveDropsFeedV2(...args),
}));

jest.mock("@/utils/monitoring/serverRouteTelemetry", () => ({
  getServerRouteAuthCohort: jest.fn(() => "authenticated"),
  SERVER_ROUTE_SPAN_NAMES: {
    wavesInitialFeedFetch: "waves.initial_feed.fetch",
  },
  traceServerRouteData: (options: unknown, task: () => Promise<unknown>) =>
    mockTraceServerRouteData(options, task),
}));

import { fetchServerWaveFeedSeed } from "@/app/waves/wave-feed-seed.server";
import {
  SERVER_WAVE_FEED_SEED_LIMIT,
  SERVER_WAVE_FEED_SEED_REQUEST_LIMIT,
} from "@/contexts/wave/server-wave-feed-seed";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";

const makeDrop = (serialNo: number) => ({
  id: `drop-${serialNo}`,
  serial_no: serialNo,
  wave: {
    id: "wave-1",
    authenticated_user_eligible_to_chat: true,
  },
});

describe("fetchServerWaveFeedSeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTraceServerRouteData.mockImplementation(
      async (_options: unknown, task: () => Promise<unknown>) => task()
    );
  });

  it("preserves the browser page size and uses one extra item for an authoritative cursor", async () => {
    const safeHeaders = { "x-safe-server-context": "present" };
    mockFetchWaveDropsFeedV2.mockResolvedValue({
      wave: { id: "wave-1" },
      drops: Array.from(
        { length: SERVER_WAVE_FEED_SEED_REQUEST_LIMIT },
        (_, index) => makeDrop(index + 1)
      ),
    });

    const result = await fetchServerWaveFeedSeed({
      headers: safeHeaders,
      routeFamily: "/waves/[wave]",
      waveId: "wave-1",
    });

    expect(SERVER_WAVE_FEED_SEED_LIMIT).toBe(WAVE_DROPS_PARAMS.limit);
    expect(SERVER_WAVE_FEED_SEED_REQUEST_LIMIT).toBe(
      WAVE_DROPS_PARAMS.limit + 1
    );
    expect(mockFetchWaveDropsFeedV2).toHaveBeenCalledTimes(1);
    expect(mockFetchWaveDropsFeedV2).toHaveBeenCalledWith({
      waveId: "wave-1",
      limit: WAVE_DROPS_PARAMS.limit + 1,
      headers: safeHeaders,
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        hasNextPage: true,
        drops: expect.arrayContaining([
          expect.objectContaining({ id: "drop-1" }),
        ]),
      })
    );
    if (result.ok) {
      expect(result.drops).toHaveLength(WAVE_DROPS_PARAMS.limit);
      expect(result.drops[0]).not.toHaveProperty("wave");
    }
    expect(mockTraceServerRouteData).toHaveBeenCalledWith(
      {
        name: "waves.initial_feed.fetch",
        routeFamily: "/waves/[wave]",
        dataPath: "wave_initial_feed",
        authCohort: "authenticated",
      },
      expect.any(Function)
    );
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("x-safe-server-context");
    expect(serialized).not.toContain("present");
    expect(serialized).not.toContain("authenticated_user_eligible");
  });

  it("does not claim a next page when the exact final page is full", async () => {
    mockFetchWaveDropsFeedV2.mockResolvedValue({
      wave: { id: "wave-1" },
      drops: Array.from({ length: SERVER_WAVE_FEED_SEED_LIMIT }, (_, index) =>
        makeDrop(index + 1)
      ),
    });

    const result = await fetchServerWaveFeedSeed({
      headers: {},
      routeFamily: "/messages/[wave]",
      waveId: "wave-1",
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: true, hasNextPage: false })
    );
    expect(mockTraceServerRouteData).toHaveBeenCalledWith(
      expect.objectContaining({ routeFamily: "/messages/[wave]" }),
      expect.any(Function)
    );
  });

  it("returns a serializable retry signal without leaking failure details", async () => {
    mockFetchWaveDropsFeedV2.mockRejectedValue(
      new Error("private upstream detail")
    );

    const result = await fetchServerWaveFeedSeed({
      headers: { "x-safe-server-context": "present" },
      routeFamily: "/waves/[wave]",
      waveId: "wave-1",
    });

    expect(result).toEqual({ ok: false, waveId: "wave-1" });
    expect(JSON.stringify(result)).not.toContain("private upstream detail");
    expect(JSON.stringify(result)).not.toContain("x-safe-server-context");
  });
});
