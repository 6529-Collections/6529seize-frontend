import { probeDropMediaFailure } from "@/components/drops/view/item/content/media/dropMediaRetry";

const PROXY_URL =
  "/api/og-metadata/image?url=https%3A%2F%2Fcdn.test%2Fart.gif&animated=1&w=800";

describe("probeDropMediaFailure", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockFetch = (implementation: () => Promise<Response>) => {
    const fetchMock = jest.fn(implementation);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  };

  it.each([
    [200, "available"],
    [204, "available"],
    [408, "retryable"],
    [429, "retryable"],
    [503, "retryable"],
    [400, "definitive"],
    [403, "definitive"],
    [404, "definitive"],
    [500, "upstream"],
    [502, "upstream"],
    [504, "upstream"],
  ] as const)(
    "classifies the proxy's %i answer as %s and discards the body",
    async (status, expected) => {
      const cancel = jest.fn().mockResolvedValue(undefined);
      const fetchMock = mockFetch(async () => {
        return { status, body: { cancel } } as unknown as Response;
      });
      const controller = new AbortController();

      await expect(
        probeDropMediaFailure(PROXY_URL, controller.signal)
      ).resolves.toBe(expected);

      expect(fetchMock).toHaveBeenCalledWith(PROXY_URL, {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      expect(cancel).toHaveBeenCalledTimes(1);
    }
  );

  it("retries after a network failure", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    await expect(
      probeDropMediaFailure(PROXY_URL, new AbortController().signal)
    ).resolves.toBe("retryable");
  });

  it("rethrows once the caller has aborted", async () => {
    const controller = new AbortController();
    mockFetch(() => {
      controller.abort();
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });

    await expect(
      probeDropMediaFailure(PROXY_URL, controller.signal)
    ).rejects.toThrow("Aborted");
  });
});
