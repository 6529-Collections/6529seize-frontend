import { QueryClient } from "@tanstack/react-query";

import { renderWavesPageContent } from "@/app/waves/waves-page.shared";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { getWaveQueryKey } from "@/services/api/wave-query";

const mockTraceServerRouteData = jest.fn(
  async (_options: unknown, task: () => Promise<unknown> | unknown) => task()
);

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("@/utils/monitoring/serverRouteTelemetry", () => ({
  getServerRouteAuthCohort: jest.fn((headers: Record<string, string>) =>
    headers["Authorization"] ? "authenticated" : "anonymous"
  ),
  SERVER_ROUTE_SPAN_NAMES: {
    wavesIndexDataPath: "waves.index.server_data",
    wavesMetadataFetch: "waves.metadata.fetch",
  },
  traceServerRouteData: (
    options: unknown,
    task: () => Promise<unknown> | unknown
  ) => mockTraceServerRouteData(options, task),
}));
jest.mock("@/app/waves/page.client", () => ({
  __esModule: true,
  default: () => <div data-testid="waves-page-client" />,
}));
jest.mock("@/lib/structured-data/waves", () => ({
  buildWavePageJsonLd: jest.fn(() => ({})),
  buildWavesIndexPageJsonLd: jest.fn(() => ({})),
}));

const wave = {
  id: "wave-detail-data-path",
  name: "Data Path Wave",
  author: {},
  chat: { scope: { group: { is_direct_message: false } } },
} as ApiWave;

describe("renderWavesPageContent data paths", () => {
  let prefetchQuery: jest.SpyInstance;
  let prefetchInfiniteQuery: jest.SpyInstance;
  let setQueryData: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTraceServerRouteData.mockImplementation(
      async (_options: unknown, task: () => Promise<unknown> | unknown) =>
        task()
    );
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({
      Authorization: "Bearer token",
    });
    prefetchQuery = jest.spyOn(QueryClient.prototype, "prefetchQuery");
    prefetchInfiniteQuery = jest.spyOn(
      QueryClient.prototype,
      "prefetchInfiniteQuery"
    );
    setQueryData = jest.spyOn(QueryClient.prototype, "setQueryData");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not block the /waves index on any server data query", async () => {
    await renderWavesPageContent({ waveId: null, searchParams: {} });

    expect(getAppCommonHeaders).not.toHaveBeenCalled();
    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(setQueryData).not.toHaveBeenCalled();
    expect(prefetchQuery).not.toHaveBeenCalled();
    expect(prefetchInfiniteQuery).not.toHaveBeenCalled();
    expect(mockTraceServerRouteData).toHaveBeenCalledWith(
      {
        name: "waves.index.server_data",
        routeFamily: "/waves",
        dataPath: "none",
        apiRequestCount: 0,
      },
      expect.any(Function)
    );
  });

  it("hydrates only the mounted wave metadata query for /waves/{waveId}", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue(wave);

    await renderWavesPageContent({
      waveId: wave.id,
      searchParams: {},
    });

    expect(commonApiFetch).toHaveBeenCalledTimes(1);
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `waves/${wave.id}`,
      headers: { Authorization: "Bearer token" },
    });
    expect(getWaveQueryKey(wave.id)).toEqual(["WAVE", { wave_id: wave.id }]);
    expect(setQueryData).toHaveBeenCalledWith(getWaveQueryKey(wave.id), wave);
    expect(prefetchQuery).not.toHaveBeenCalled();
    expect(prefetchInfiniteQuery).not.toHaveBeenCalled();
    expect(mockTraceServerRouteData).toHaveBeenCalledWith(
      {
        name: "waves.metadata.fetch",
        routeFamily: "/waves/[wave]",
        dataPath: "wave_metadata",
        apiRequestCount: 1,
        authCohort: "authenticated",
      },
      expect.any(Function)
    );
  });

  it("keeps the Wave detail preview available without authentication", async () => {
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({});
    (commonApiFetch as jest.Mock).mockResolvedValue(wave);

    await renderWavesPageContent({
      waveId: wave.id,
      searchParams: {},
    });

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `waves/${wave.id}`,
      headers: {},
    });
    expect(setQueryData).toHaveBeenCalledWith(getWaveQueryKey(wave.id), wave);
    expect(prefetchQuery).not.toHaveBeenCalled();
    expect(prefetchInfiniteQuery).not.toHaveBeenCalled();
  });

  it("preserves the Wave route fallback when metadata loading fails", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    const fetchError = new Error("wave failed");
    const tracedTaskErrors: unknown[] = [];
    mockTraceServerRouteData.mockImplementation(
      async (_options: unknown, task: () => Promise<unknown> | unknown) => {
        try {
          return await task();
        } catch (error) {
          tracedTaskErrors.push(error);
          throw error;
        }
      }
    );
    (commonApiFetch as jest.Mock).mockRejectedValue(fetchError);

    await expect(
      renderWavesPageContent({
        waveId: "wave-failure-data-path",
        searchParams: { serialNo: "42" },
      })
    ).resolves.toBeDefined();

    expect(setQueryData).not.toHaveBeenCalled();
    expect(prefetchQuery).not.toHaveBeenCalled();
    expect(prefetchInfiniteQuery).not.toHaveBeenCalled();
    expect(tracedTaskErrors).toEqual([fetchError]);
    expect(warning).toHaveBeenCalledWith("Failed to fetch wave", {
      waveId: "wave-failure-data-path",
      error: fetchError,
    });
    warning.mockRestore();
  });
});
