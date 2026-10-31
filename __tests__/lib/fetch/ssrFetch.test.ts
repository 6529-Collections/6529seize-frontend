/** @jest-environment node */

const mockNativeFetch = jest.fn();
const mockGetAppCommonHeaders = jest.fn();
let mockServerCredentialsAvailable = true;
let mockProductionBuildPhase = false;
let mockServerStagingApiKey: string | undefined;

jest.mock("@/config/env", () => ({
  publicEnv: { API_ENDPOINT: "https://api.example.test" },
}));
jest.mock("@/config/nextPhase", () => ({
  isProductionBuildPhase: () => mockProductionBuildPhase,
}));
jest.mock("@/config/serverEnv", () => ({
  getServerEnvOrThrow: () => {
    if (!mockServerCredentialsAvailable) {
      throw new Error("SSR credentials are not configured");
    }
    const signingValueKey = ["SSR_CLIENT", "SECRET"].join("_");
    return {
      SSR_CLIENT_ID: "client-id",
      [signingValueKey]: "fixture-signing-value",
    };
  },
  getStagingApiKey: () => mockServerStagingApiKey,
}));
jest.mock("@/helpers/server-signature.helpers", () => ({
  generateClientSignature: () => ({
    clientId: "client-id",
    signature: "request-signature",
    timestamp: 123,
  }),
  generateWafSignature: () => "waf-signature",
}));
jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: () => mockGetAppCommonHeaders(),
}));

const API_URL = "https://api.example.test/api/identities/punk6529";
const loadSsrFetch = () => import("@/lib/fetch/ssrFetch");

/** A native fetch that only settles when the request's signal aborts. */
const hangUntilAborted = (input: RequestInfo | URL, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    const signal = input instanceof Request ? input.signal : init?.signal;
    signal?.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });

/** The wrapper reads cookies before sending, so let that settle first. */
const waitForNativeFetch = async () => {
  for (let tick = 0; tick < 50; tick += 1) {
    if (mockNativeFetch.mock.calls.length > 0) return;
    await Promise.resolve();
  }
  throw new Error("native fetch was never called");
};

const sentRequest = (): Request => mockNativeFetch.mock.calls[0]?.[0];
const sentInit = (): RequestInit | undefined =>
  mockNativeFetch.mock.calls[0]?.[1];

/** What Node raises when the peer drops the connection mid-response. */
const connectionReset = () =>
  Object.assign(new Error("aborted"), { code: "ECONNRESET" });

/** One chunk arrives, then the test decides when the connection resets. */
const resettableBody = (
  cancel: () => Promise<void> | void = () => undefined
) => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const onCancel = jest.fn(cancel);
  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
      streamController.enqueue(new TextEncoder().encode('{"a":'));
    },
    cancel: onCancel,
  });
  return {
    body,
    cancel: onCancel,
    reset: () => controller.error(connectionReset()),
  };
};

/** Real macrotask turns, so a stray rejection or exception has surfaced. */
const settle = async () => {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
};

describe("ssrFetch", () => {
  const originalFetch = globalThis.fetch;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useFakeTimers({
      doNotFake: ["nextTick", "queueMicrotask", "setImmediate"],
    });
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockServerCredentialsAvailable = true;
    mockProductionBuildPhase = false;
    mockServerStagingApiKey = undefined;
    mockNativeFetch.mockResolvedValue(new Response(null, { status: 204 }));
    mockGetAppCommonHeaders.mockResolvedValue({
      Authorization: "Bearer viewer-wallet",
      "x-6529-auth": "environment-access",
    });
    globalThis.fetch = mockNativeFetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    warnSpy.mockRestore();
    globalThis.fetch = originalFetch;
  });

  describe("anonymousSsrFetch", () => {
    it("preserves environment access and SSR signatures without forwarding wallet auth", async () => {
      const { anonymousSsrFetch } = await loadSsrFetch();

      await anonymousSsrFetch("https://api.example.test/api/public-feed", {
        headers: {
          Authorization: "Bearer explicitly-provided-wallet",
          "x-caller": "server-render",
        },
      });

      expect(mockNativeFetch).toHaveBeenCalledTimes(1);
      const headers = sentRequest().headers;
      expect(headers.get("Authorization")).toBeNull();
      expect(headers.get("x-6529-auth")).toBe("environment-access");
      expect(headers.get("x-6529-internal-id")).toBe("client-id");
      expect(headers.get("x-6529-internal-signature")).toBe(
        "request-signature"
      );
      expect(headers.get("x-caller")).toBe("server-render");
    });
  });

  describe("server-held staging access", () => {
    it("sends the server staging key when no access value is present", async () => {
      mockServerStagingApiKey = "server-staging-key";
      mockGetAppCommonHeaders.mockResolvedValue({});
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL);

      expect(sentRequest().headers.get("x-6529-auth")).toBe(
        "server-staging-key"
      );
    });

    it("keeps an access value the caller already sent", async () => {
      mockServerStagingApiKey = "server-staging-key";
      mockGetAppCommonHeaders.mockResolvedValue({});
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL, { headers: { "x-6529-auth": "caller-access" } });

      expect(sentRequest().headers.get("x-6529-auth")).toBe("caller-access");
    });

    it("prefers the visitor's access cookie on the signed path", async () => {
      mockServerStagingApiKey = "server-staging-key";
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL);

      expect(sentRequest().headers.get("x-6529-auth")).toBe(
        "environment-access"
      );
    });

    it("applies when SSR credentials are unavailable", async () => {
      mockServerCredentialsAvailable = false;
      mockServerStagingApiKey = "server-staging-key";
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL);

      expect(sentRequest().headers.get("x-6529-auth")).toBe(
        "server-staging-key"
      );
    });

    it("never follows a redirect while carrying the server staging key", async () => {
      mockServerStagingApiKey = "server-staging-key";
      mockGetAppCommonHeaders.mockResolvedValue({});
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL);

      expect(sentRequest().headers.get("x-6529-auth")).toBe(
        "server-staging-key"
      );
      expect(sentRequest().redirect).toBe("error");
    });

    it("keeps a caller's manual redirect handling with the server staging key", async () => {
      mockServerStagingApiKey = "server-staging-key";
      mockGetAppCommonHeaders.mockResolvedValue({});
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL, { redirect: "manual" });

      expect(sentRequest().redirect).toBe("manual");
    });

    it("leaves redirects alone when the visitor's access value is sent", async () => {
      mockServerStagingApiKey = "server-staging-key";
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL);

      expect(sentRequest().headers.get("x-6529-auth")).toBe(
        "environment-access"
      );
      expect(sentRequest().redirect).toBe("follow");
    });

    it("never sends the server staging key to another origin", async () => {
      mockServerStagingApiKey = "server-staging-key";
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch("https://elsewhere.example.test/api/thing");

      const [input, init] = mockNativeFetch.mock.calls[0] ?? [];
      expect(input).toBe("https://elsewhere.example.test/api/thing");
      expect(init).toBeUndefined();
    });
  });

  describe("server deadline for first-party API requests", () => {
    it("fails an API request that outlives the deadline with a TimeoutError", async () => {
      mockNativeFetch.mockImplementation(hangUntilAborted);
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const outcome = expect(
        ssrFetch(`${API_URL}?token=secret-query-token`)
      ).rejects.toHaveProperty("name", "TimeoutError");
      await waitForNativeFetch();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;

      expect(sentRequest().signal.aborted).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("does not abort before the deadline", async () => {
      mockNativeFetch.mockImplementation(hangUntilAborted);
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const outcome = expect(ssrFetch(API_URL)).rejects.toHaveProperty(
        "name",
        "TimeoutError"
      );
      await waitForNativeFetch();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS - 1);

      expect(sentRequest().signal.aborted).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      await outcome;
    });

    it("logs the timeout without identifiers, query strings or the host", async () => {
      mockNativeFetch.mockImplementation(hangUntilAborted);
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const outcome = expect(
        ssrFetch(`${API_URL}?token=secret-query-token`)
      ).rejects.toHaveProperty("name", "TimeoutError");
      await waitForNativeFetch();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const logged = String(warnSpy.mock.calls[0]?.[0]);
      expect(logged).toContain("GET /api/identities/*");
      expect(logged).not.toContain("punk6529");
      expect(logged).not.toContain("secret-query-token");
      expect(logged).not.toContain("api.example.test");
    });

    it("applies the deadline when SSR credentials are unavailable", async () => {
      mockServerCredentialsAvailable = false;
      mockNativeFetch.mockImplementation(hangUntilAborted);
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const outcome = expect(ssrFetch(API_URL)).rejects.toHaveProperty(
        "name",
        "TimeoutError"
      );
      await waitForNativeFetch();
      expect(sentRequest().headers.get("x-6529-internal-id")).toBeNull();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;

      expect(jest.getTimerCount()).toBe(0);
    });

    it("discards a response that arrives after the deadline", async () => {
      const late = new Response("late", { status: 200 });
      const cancel = jest.spyOn(late.body as ReadableStream, "cancel");
      mockNativeFetch.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            setTimeout(() => resolve(late), 10_000);
          })
      );
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const outcome = expect(ssrFetch(API_URL)).rejects.toHaveProperty(
        "name",
        "TimeoutError"
      );
      await waitForNativeFetch();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;
      await jest.advanceTimersByTimeAsync(10_000);

      expect(cancel).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe("caller-supplied signals", () => {
    it("surfaces the caller's own abort reason and still cancels the transfer", async () => {
      mockNativeFetch.mockImplementation(hangUntilAborted);
      const { ssrFetch } = await loadSsrFetch();
      const controller = new AbortController();
      const reason = new Error("caller no longer needs this");

      const outcome = expect(
        ssrFetch(API_URL, { signal: controller.signal })
      ).rejects.toBe(reason);
      await waitForNativeFetch();
      controller.abort(reason);
      await outcome;

      expect(sentInit()?.signal?.aborted).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it("still applies the deadline to a call that supplies a signal", async () => {
      mockNativeFetch.mockImplementation(hangUntilAborted);
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();
      const controller = new AbortController();

      const outcome = expect(
        ssrFetch(API_URL, { signal: controller.signal })
      ).rejects.toHaveProperty("name", "TimeoutError");
      await waitForNativeFetch();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;

      expect(controller.signal.aborted).toBe(false);
    });

    it("does not send a request whose caller signal is already aborted", async () => {
      const { ssrFetch } = await loadSsrFetch();
      const reason = new Error("already cancelled");

      await expect(
        ssrFetch(API_URL, { signal: AbortSignal.abort(reason) })
      ).rejects.toBe(reason);

      expect(mockNativeFetch).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it("honors the signal carried by a Request input", async () => {
      mockNativeFetch.mockImplementation(hangUntilAborted);
      const { ssrFetch } = await loadSsrFetch();
      const controller = new AbortController();
      const reason = new Error("request cancelled");

      const outcome = expect(
        ssrFetch(new Request(API_URL, { signal: controller.signal }))
      ).rejects.toBe(reason);
      await waitForNativeFetch();
      controller.abort(reason);
      await outcome;

      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe("requests that are not first-party API calls", () => {
    it("leaves a third-party request exactly as the caller sent it", async () => {
      const { ssrFetch } = await loadSsrFetch();
      const init = { headers: { "x-caller": "server-render" } };

      await ssrFetch("https://third-party.example/slow?page=1", init);

      expect(mockNativeFetch).toHaveBeenCalledTimes(1);
      expect(mockNativeFetch).toHaveBeenCalledWith(
        "https://third-party.example/slow?page=1",
        init
      );
      expect(jest.getTimerCount()).toBe(0);
    });

    it("leaves a look-alike host and a different port untouched", async () => {
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch("https://api.example.test.attacker.example/api/x");
      await ssrFetch("https://api.example.test:8443/api/x");

      expect(mockNativeFetch).toHaveBeenCalledTimes(2);
      expect(mockNativeFetch.mock.calls.map(([, init]) => init)).toEqual([
        undefined,
        undefined,
      ]);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("never applies the deadline during the production build", async () => {
      mockProductionBuildPhase = true;
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL);

      expect(mockNativeFetch).toHaveBeenCalledTimes(1);
      expect(mockNativeFetch.mock.calls[0]?.[0]).toBe(API_URL);
      expect(sentInit()?.signal).toBeUndefined();
      expect(new Headers(sentInit()?.headers).get("x-6529-internal-id")).toBe(
        "client-id"
      );
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe("timer lifetime", () => {
    it("holds the deadline until the body is read, then releases it", async () => {
      mockNativeFetch.mockResolvedValue(
        new Response(JSON.stringify({ handle: "punk6529" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
      const { ssrFetch } = await loadSsrFetch();

      const response = await ssrFetch(API_URL);
      expect(response.status).toBe(200);
      expect(jest.getTimerCount()).toBe(1);

      await expect(response.json()).resolves.toEqual({ handle: "punk6529" });
      expect(jest.getTimerCount()).toBe(0);
    });

    it("releases the deadline immediately for a response without a body", async () => {
      const { ssrFetch } = await loadSsrFetch();

      const response = await ssrFetch(API_URL);

      expect(response.status).toBe(204);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("releases the deadline when the request fails", async () => {
      mockNativeFetch.mockRejectedValue(new TypeError("fetch failed"));
      const { ssrFetch } = await loadSsrFetch();

      await expect(ssrFetch(API_URL)).rejects.toThrow("fetch failed");

      expect(jest.getTimerCount()).toBe(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("fails a body that stalls past the deadline with the same TimeoutError", async () => {
      const stalled = new ReadableStream<Uint8Array>({
        pull: () => new Promise<void>(() => undefined),
      });
      mockNativeFetch.mockResolvedValue(new Response(stalled, { status: 200 }));
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const response = await ssrFetch(API_URL);
      const outcome = expect(response.text()).rejects.toHaveProperty(
        "name",
        "TimeoutError"
      );
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;

      expect(jest.getTimerCount()).toBe(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("Next.js request memoization", () => {
    it("hands a plain GET to the next layer as a Request so memoization survives", async () => {
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL, { cache: "no-store" });

      expect(sentRequest()).toBeInstanceOf(Request);
      expect(sentRequest().url).toBe(API_URL);
      expect(sentRequest().cache).toBe("no-store");
      expect(sentRequest().signal).toBeInstanceOf(AbortSignal);
      expect(sentInit()).toBeUndefined();
    });

    it("keeps Next-only fetch options on init", async () => {
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL, { next: { revalidate: 60, tags: ["identity"] } });

      expect(sentRequest()).toBeInstanceOf(Request);
      expect(sentInit()).toEqual({
        next: { revalidate: 60, tags: ["identity"] },
      });
    });

    it("keeps the plain init form for calls that Next never memoizes", async () => {
      const { ssrFetch } = await loadSsrFetch();

      await ssrFetch(API_URL, { method: "POST", body: "{}" });

      expect(mockNativeFetch.mock.calls[0]?.[0]).toBe(API_URL);
      expect(sentInit()?.method).toBe("POST");
      expect(sentInit()?.body).toBe("{}");
      expect(sentInit()?.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("connection resets and late stream errors", () => {
    // jest-circus listens for unhandledRejection and uncaughtException on the
    // real process and fails the running test, so each case settles real
    // macrotask turns and then simply finishes. (A listener added here would
    // sit on the sandboxed process object and never fire.)
    it("rejects the reader of a body that resets mid-transfer without a stray error", async () => {
      const { body, reset } = resettableBody();
      mockNativeFetch.mockResolvedValue(new Response(body, { status: 200 }));
      const { ssrFetch } = await loadSsrFetch();

      const response = await ssrFetch(API_URL);
      const read = expect(response.text()).rejects.toMatchObject({
        code: "ECONNRESET",
      });
      await settle();
      reset();
      await read;
      await settle();
      expect(jest.getTimerCount()).toBe(0);
    });

    it("tolerates a reset on a body nobody reads", async () => {
      const { body, reset } = resettableBody();
      mockNativeFetch.mockResolvedValue(new Response(body, { status: 200 }));
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      await ssrFetch(API_URL);
      reset();
      await settle();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await settle();
      expect(jest.getTimerCount()).toBe(0);
    });

    describe.each([
      ["already reset", false],
      ["reset after it is discarded", true],
    ])(
      "a response that arrives after the deadline and is %s",
      (_name, late) => {
        it("is discarded without a stray error", async () => {
          const { body, reset, cancel } = resettableBody();
          if (!late) reset();
          mockNativeFetch.mockImplementation(
            () =>
              new Promise<Response>((resolve) => {
                setTimeout(() => resolve(new Response(body)), 10_000);
              })
          );
          const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

          const outcome = expect(ssrFetch(API_URL)).rejects.toHaveProperty(
            "name",
            "TimeoutError"
          );
          await waitForNativeFetch();
          await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
          await outcome;
          await jest.advanceTimersByTimeAsync(10_000);
          if (late) reset();
          await settle();

          // An already errored stream has nothing left to cancel upstream.
          expect(cancel).toHaveBeenCalledTimes(late ? 1 : 0);
          expect(jest.getTimerCount()).toBe(0);
        });
      }
    );

    it("discards a late response whose own cancellation fails", async () => {
      const { body } = resettableBody(() => Promise.reject(connectionReset()));
      mockNativeFetch.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            setTimeout(() => resolve(new Response(body)), 10_000);
          })
      );
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const outcome = expect(ssrFetch(API_URL)).rejects.toHaveProperty(
        "name",
        "TimeoutError"
      );
      await waitForNativeFetch();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;
      await jest.advanceTimersByTimeAsync(10_000);
      await settle();
    });

    it.each([
      ["a reader is waiting", true],
      ["nobody is reading", false],
    ])(
      "cancels the body at the deadline when %s and survives the reset that follows",
      async (_name, reading) => {
        const { body, reset, cancel } = resettableBody();
        mockNativeFetch.mockResolvedValue(new Response(body, { status: 200 }));
        const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

        const response = await ssrFetch(API_URL);
        const outcome = reading
          ? expect(response.text()).rejects.toHaveProperty(
              "name",
              "TimeoutError"
            )
          : Promise.resolve();
        await settle();
        await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
        await outcome;
        reset();
        await settle();

        expect(cancel).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
      }
    );

    it("survives an upstream whose cancellation fails when the deadline cancels it", async () => {
      const { body } = resettableBody(() => Promise.reject(connectionReset()));
      mockNativeFetch.mockResolvedValue(new Response(body, { status: 200 }));
      const { ssrFetch, SSR_API_TIMEOUT_MS } = await loadSsrFetch();

      const response = await ssrFetch(API_URL);
      const outcome = expect(response.text()).rejects.toHaveProperty(
        "name",
        "TimeoutError"
      );
      await settle();
      await jest.advanceTimersByTimeAsync(SSR_API_TIMEOUT_MS);
      await outcome;
      await settle();
    });

    it("lets the consumer cancel a body and survives the reset that follows", async () => {
      const { body, reset, cancel } = resettableBody();
      mockNativeFetch.mockResolvedValue(new Response(body, { status: 200 }));
      const { ssrFetch } = await loadSsrFetch();

      const response = await ssrFetch(API_URL);
      await response.body?.cancel(new Error("consumer gone"));
      reset();
      await settle();

      expect(cancel).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
