import { ReadableStream } from "node:stream/web";

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.6529.test",
  },
}));

jest.mock("@/config/serverEnv", () => ({
  getStagingApiKey: jest.fn(),
}));

import { withOgApiJson } from "@/app/api/og-metadata/_lib/apiMetadata";
import { publicEnv } from "@/config/env";
import { getStagingApiKey } from "@/config/serverEnv";

const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

const jsonResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  headers: new Headers({ "content-type": "application/json" }),
  body: new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
      controller.close();
    },
  }),
});

const failure = (status: number) => ({
  ok: false,
  status,
  headers: new Headers(),
  body: { cancel: jest.fn().mockResolvedValue(undefined) },
});

const read = (
  segments: readonly string[],
  query?: Readonly<Record<string, string>>,
  signal?: AbortSignal,
  options?: { readonly timeoutMs?: number }
) => withOgApiJson(signal, (fetchJson) => fetchJson(segments, query), options);

describe("withOgApiJson", () => {
  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
    mockFetch.mockImplementation(async () => jsonResponse({ ok: true }));
    jest.mocked(getStagingApiKey).mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe("request URLs", () => {
    it("builds the URL from the configured API base and fixed segments", async () => {
      await read(["nextgen", "collections", "12"]);
      await read(["nfts"], { contract: "0xAbC123", id: "542" });

      expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
        "https://api.6529.test/api/nextgen/collections/12",
        "https://api.6529.test/api/nfts?contract=0xAbC123&id=542",
      ]);
    });

    it("keeps a path prefix on the configured API base", async () => {
      jest.replaceProperty(
        publicEnv,
        "API_ENDPOINT",
        "https://api.6529.test/v2/"
      );

      await read(["memes_latest"]);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.6529.test/v2/api/memes_latest",
        expect.any(Object)
      );
    });

    it.each([
      ["a traversal sequence", ["..%2f"]],
      ["an encoded traversal sequence", ["%2e%2e"]],
      ["a dot segment", [".."]],
      ["a nested dot segment", ["nfts", "..", "admin"]],
      ["userinfo", ["@evil.com"]],
      ["an absolute URL", ["https://evil.test/x"]],
      ["a scheme-relative URL", ["//evil.test"]],
      ["a path separator", ["nfts/../admin"]],
      ["a backslash", ["nfts\\admin"]],
      ["a query delimiter", ["nfts?contract=1"]],
      ["a fragment delimiter", ["nfts#"]],
      ["whitespace", ["nfts admin"]],
      ["an empty segment", [""]],
      ["an oversized segment", ["a".repeat(81)]],
      ["no segments", []],
    ])("never requests a path containing %s", async (_name, segments) => {
      await expect(read(segments)).rejects.toThrow(/Card metadata/);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it.each([
      ["an absolute URL", { contract: "https://evil.test" }],
      ["a parameter injection", { id: "1&admin=1" }],
      ["an encoded traversal sequence", { id: "..%2f" }],
      ["userinfo", { contract: "0xabc@evil.com" }],
      ["a path separator", { id: "1/2" }],
      ["an empty value", { id: "" }],
      ["an oversized value", { id: "1".repeat(81) }],
      ["an injected key", { "id=1&admin": "1" }],
      ["an uppercase key", { Id: "1" }],
    ])("never requests a query containing %s", async (_name, query) => {
      await expect(read(["nfts"], query)).rejects.toThrow(/Card metadata/);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("never sends staging access to a rejected request", async () => {
      jest.mocked(getStagingApiKey).mockReturnValue("test-staging-key");

      await expect(read(["https://evil.test"])).rejects.toThrow();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("transient failures", () => {
    it.each([429, 502, 503, 504])(
      "retries a %s response once and returns the retried data",
      async (status) => {
        mockFetch
          .mockResolvedValueOnce(failure(status))
          .mockResolvedValueOnce(jsonResponse({ id: 1 }));

        await expect(read(["nextgen", "tokens", "1"])).resolves.toEqual({
          id: 1,
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch.mock.calls[1]?.[0]).toBe(mockFetch.mock.calls[0]?.[0]);
      }
    );

    it("retries a network error once", async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValueOnce(jsonResponse({ id: 1 }));

      await expect(read(["nextgen", "tokens", "1"])).resolves.toEqual({
        id: 1,
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("stops after one retry", async () => {
      mockFetch.mockResolvedValue(failure(503));

      await expect(read(["nextgen", "tokens", "1"])).rejects.toThrow(
        "Card metadata is unavailable."
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it.each([400, 404, 500])("does not retry a %s response", async (status) => {
      mockFetch.mockResolvedValue(failure(status));

      await expect(read(["nextgen", "tokens", "1"])).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry a cancelled request", async () => {
      const controller = new AbortController();
      mockFetch.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true }
            );
          })
      );

      const result = read(["nfts"], undefined, controller.signal);
      controller.abort();

      await expect(result).rejects.toThrow("aborted");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("lookup deadline", () => {
    const hang = () =>
      mockFetch.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true }
            );
          })
      );

    it("gives up after five seconds by default", async () => {
      jest.useFakeTimers();
      hang();
      const outcome = read(["nfts"]).then(
        () => "resolved",
        () => "rejected"
      );

      await jest.advanceTimersByTimeAsync(4_999);
      expect(mockFetch.mock.calls[0]?.[1].signal.aborted).toBe(false);
      await jest.advanceTimersByTimeAsync(1);

      await expect(outcome).resolves.toBe("rejected");
    });

    it("honors a longer deadline when one is requested", async () => {
      jest.useFakeTimers();
      hang();
      const outcome = read(["nfts"], undefined, undefined, {
        timeoutMs: 10_000,
      }).then(
        () => "resolved",
        () => "rejected"
      );

      await jest.advanceTimersByTimeAsync(5_000);
      expect(mockFetch.mock.calls[0]?.[1].signal.aborted).toBe(false);
      await jest.advanceTimersByTimeAsync(5_000);

      await expect(outcome).resolves.toBe("rejected");
    });
  });
});
