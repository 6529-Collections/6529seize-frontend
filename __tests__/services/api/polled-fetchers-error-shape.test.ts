import { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import { shouldRetryQuery } from "@/components/react-query-wrapper/utils/query-utils";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { fetchNotificationsV2 } from "@/services/api/notifications-v2-api";
import {
  fetchOfficialWaves,
  fetchWaveSubwavesPage,
  fetchWavesV2Page,
} from "@/services/api/waves-v2-api";

const fetchMock = globalThis.fetch as jest.Mock;

const fetchers: ReadonlyArray<readonly [string, () => Promise<unknown>]> = [
  ["fetchWavesV2Page", () => fetchWavesV2Page({ page: 1, pageSize: 20 })],
  [
    "fetchWavesV2Page (pinned page walk)",
    () =>
      fetchWavesV2Page({
        page: 2,
        pageSize: 20,
        pinned: ApiWavesPinFilter.Pinned,
      }),
  ],
  ["fetchOfficialWaves", () => fetchOfficialWaves()],
  [
    "fetchWaveSubwavesPage",
    () => fetchWaveSubwavesPage({ parentWaveId: "parent-wave" }),
  ],
  ["fetchNotificationsV2", () => fetchNotificationsV2({ limit: "30" })],
];

const respondWith = (status: number, statusText: string, body?: unknown) => {
  fetchMock.mockResolvedValue({
    ok: false,
    status,
    statusText,
    headers: new Headers({ "retry-after": "5" }),
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  });
};

const rejection = async (run: () => Promise<unknown>): Promise<unknown> => {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the fetcher to reject");
};

describe.each(fetchers)("%s rejection shape", (_name, run) => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it.each([
    [400, "Bad Request"],
    [401, "Unauthorized"],
    [403, "Forbidden"],
    [404, "Not Found"],
    [429, "Too Many Requests"],
  ])(
    "rejects %i with a structured error that React Query does not retry",
    async (status, statusText) => {
      respondWith(status, statusText, { error: `${statusText} from API` });

      const error = await rejection(run);

      expect(error).toBeInstanceOf(Error);
      expect(getStructuredApiErrorStatus(error)).toBe(status);
      expect((error as Error).message).toBe(`${statusText} from API`);
      expect(String(error)).not.toContain("[object Object]");
      expect(shouldRetryQuery(0, error)).toBe(false);
    }
  );

  it("falls back to the status text when the body has no message", async () => {
    respondWith(429, "Too Many Requests");

    const error = await rejection(run);

    expect((error as Error).message).toBe("Too Many Requests");
    expect((error as { headers: Headers }).headers.get("retry-after")).toBe(
      "5"
    );
  });

  it.each([500, 502, 503])(
    "keeps a structured %i retryable up to the default limit",
    async (status) => {
      respondWith(status, "Server Error", { error: "Upstream failed" });

      const error = await rejection(run);

      expect(getStructuredApiErrorStatus(error)).toBe(status);
      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(2, error)).toBe(true);
      expect(shouldRetryQuery(3, error)).toBe(false);
    }
  );

  it("keeps a network failure retryable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await rejection(run);

    expect(getStructuredApiErrorStatus(error)).toBeUndefined();
    expect(shouldRetryQuery(0, error)).toBe(true);
  });
});
