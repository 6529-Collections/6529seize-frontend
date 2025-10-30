import { commonApiFetchWithRetry } from "@/services/api/common-api";

const fetchMock = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
});

describe("commonApiFetchWithRetry", () => {
  it("retries once on failure then succeeds", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => "ok",
      });

    const result = await commonApiFetchWithRetry<string>({
      endpoint: "a",
      retryOptions: { maxRetries: 1, initialDelayMs: 0, jitter: 0 },
    });

    expect(result).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after exceeding retries", async () => {
    fetchMock.mockRejectedValue(new Error("bad"));

    await expect(
      commonApiFetchWithRetry({
        endpoint: "a",
        retryOptions: { maxRetries: 1, initialDelayMs: 0, jitter: 0 },
      }),
    ).rejects.toThrow("bad");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
