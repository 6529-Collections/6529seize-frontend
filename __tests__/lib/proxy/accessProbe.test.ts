/**
 * @jest-environment node
 */

type AccessProbeModule = typeof import("@/lib/proxy/accessProbe");

const API_ENDPOINT = "https://api.staging.example";

function loadAccessProbe(): AccessProbeModule {
  let loaded: AccessProbeModule | undefined;
  jest.isolateModules(() => {
    loaded = require("@/lib/proxy/accessProbe") as AccessProbeModule;
  });
  if (!loaded) {
    throw new Error("accessProbe module did not load");
  }
  return loaded;
}

function mockFetchStatus(status: number) {
  return jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(null, { status }));
}

describe("isStagingDeployment", () => {
  const { isStagingDeployment } = loadAccessProbe();

  it.each([
    "https://staging.6529.io",
    "https://staging.6529.io/",
    "https://punk6529staging.6529.io",
    "https://STAGING.6529.io",
  ])("treats %s as a staging deployment", (baseEndpoint) => {
    expect(isStagingDeployment(baseEndpoint)).toBe(true);
  });

  it.each([
    "https://6529.io",
    "https://www.6529.io",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://test.6529.io",
    "https://api.staging.6529.io",
    "https://staging.6529.io.example.com",
    "https://staging-6529.io",
    "not a url",
    "",
  ])("does not treat %s as a staging deployment", (baseEndpoint) => {
    expect(isStagingDeployment(baseEndpoint)).toBe(false);
  });
});

describe("getAccessVerdict", () => {
  let now: number;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("forwards only the x-6529-auth value with a 1500 ms timeout", async () => {
    const timeoutSpy = jest.spyOn(AbortSignal, "timeout");
    const fetchMock = mockFetchStatus(200);
    const { getAccessVerdict } = loadAccessProbe();

    await expect(
      getAccessVerdict({ apiEndpoint: API_ENDPOINT, authValue: "team-code" })
    ).resolves.toBe("allow");

    expect(timeoutSpy).toHaveBeenCalledWith(1500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_ENDPOINT}/api/`);
    expect(init?.headers).toEqual({ "x-6529-auth": "team-code" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    [200, "allow"],
    [204, "allow"],
    [401, "unauthorized"],
    [403, "restricted"],
  ] as const)("caches the definitive %i verdict", async (status, verdict) => {
    const fetchMock = mockFetchStatus(status);
    const { getAccessVerdict } = loadAccessProbe();
    const request = { apiEndpoint: API_ENDPOINT, authValue: "team-code" };

    await expect(getAccessVerdict(request)).resolves.toBe(verdict);
    await expect(getAccessVerdict(request)).resolves.toBe(verdict);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("probes again once a cached verdict expires", async () => {
    const fetchMock = mockFetchStatus(200);
    const { getAccessVerdict } = loadAccessProbe();
    const request = { apiEndpoint: API_ENDPOINT, authValue: "team-code" };

    await getAccessVerdict(request);
    now += 59_000;
    await getAccessVerdict(request);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now += 2_000;
    await getAccessVerdict(request);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keys verdicts by auth value: same value hits, different values never share", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_url, init) => {
        const headers = init?.headers as Record<string, string>;
        const status = headers["x-6529-auth"] === "team-code" ? 200 : 401;
        return new Response(null, { status });
      });
    const { getAccessVerdict } = loadAccessProbe();
    const verdictFor = (authValue: string) =>
      getAccessVerdict({ apiEndpoint: API_ENDPOINT, authValue });

    await expect(verdictFor("team-code")).resolves.toBe("allow");
    await expect(verdictFor("wrong-code")).resolves.toBe("unauthorized");
    await expect(verdictFor("team-code2")).resolves.toBe("unauthorized");
    await expect(verdictFor("Team-code")).resolves.toBe("unauthorized");
    await expect(verdictFor("")).resolves.toBe("unauthorized");
    await expect(verdictFor("team-code")).resolves.toBe("allow");
    await expect(verdictFor("wrong-code")).resolves.toBe("unauthorized");

    // One probe per distinct value; repeats come from the cache.
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("caches values up to 256 characters and never caches longer ones", async () => {
    const fetchMock = mockFetchStatus(200);
    const { getAccessVerdict } = loadAccessProbe();
    const longest = { apiEndpoint: API_ENDPOINT, authValue: "a".repeat(256) };
    const overlong = { apiEndpoint: API_ENDPOINT, authValue: "a".repeat(257) };

    await getAccessVerdict(longest);
    await getAccessVerdict(longest);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(getAccessVerdict(overlong)).resolves.toBe("allow");
    await expect(getAccessVerdict(overlong)).resolves.toBe("allow");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[1]?.headers).toEqual({
      "x-6529-auth": "a".repeat(257),
    });
  });

  it("shares one in-flight probe between concurrent requests", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchMock = jest.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );
    const { getAccessVerdict } = loadAccessProbe();
    const request = { apiEndpoint: API_ENDPOINT, authValue: "team-code" };

    const first = getAccessVerdict(request);
    const second = getAccessVerdict(request);
    resolveFetch?.(new Response(null, { status: 200 }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      "allow",
      "allow",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([500, 502, 503, 404, 429])(
    "reports status %i as unavailable and does not cache it",
    async (status) => {
      const fetchMock = mockFetchStatus(status);
      const { getAccessVerdict } = loadAccessProbe();
      const request = { apiEndpoint: API_ENDPOINT, authValue: "team-code" };

      await expect(getAccessVerdict(request)).resolves.toBe("unavailable");
      await expect(getAccessVerdict(request)).resolves.toBe("unavailable");

      expect(fetchMock).toHaveBeenCalledTimes(2);
    }
  );

  it("reports a network error as unavailable", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("fetch failed"));
    const { getAccessVerdict } = loadAccessProbe();

    await expect(
      getAccessVerdict({ apiEndpoint: API_ENDPOINT, authValue: "team-code" })
    ).resolves.toBe("unavailable");
  });

  it("reports a timed-out probe as unavailable", async () => {
    const controller = new AbortController();
    jest.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    jest.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason)
          );
        })
    );
    const { getAccessVerdict } = loadAccessProbe();

    const verdict = getAccessVerdict({
      apiEndpoint: API_ENDPOINT,
      authValue: "team-code",
    });
    controller.abort(new DOMException("timed out", "TimeoutError"));

    await expect(verdict).resolves.toBe("unavailable");
  });
});
