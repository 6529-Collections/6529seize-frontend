import {
  commonApiFetch,
  commonApiFetchWithRetry,
} from "@/services/api/common-api";

const fetchMock = globalThis.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
});

describe("response body parsing", () => {
  it("preserves cancellation while reading an otherwise successful response", async () => {
    const abortError = new DOMException(
      "The user aborted a request.",
      "AbortError"
    );
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(abortError),
    });

    await expect(commonApiFetch({ endpoint: "a" })).rejects.toBe(abortError);
  });

  it("retains the URL and cause message for malformed JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    });

    await expect(commonApiFetch({ endpoint: "a" })).rejects.toThrow(
      "Failed to parse response as JSON from https://api.test.6529.io/api/a: Unexpected token"
    );
  });
});

describe("commonApiFetchWithRetry", () => {
  it("preserves a body-read abort without retrying a cancelled request", async () => {
    const controller = new AbortController();
    const abortError = new DOMException(
      "The user aborted a request.",
      "AbortError"
    );
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        controller.abort();
        throw abortError;
      },
    });

    await expect(
      commonApiFetchWithRetry({
        endpoint: "a",
        signal: controller.signal,
        retryOptions: { maxRetries: 2, initialDelayMs: 0, jitter: 0 },
      })
    ).rejects.toBe(abortError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it("retries once on failure then succeeds", async () => {
    fetchMock.mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce({
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
      })
    ).rejects.toThrow("bad");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
