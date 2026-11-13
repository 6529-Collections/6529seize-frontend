/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

type Proxy = typeof import("@/proxy").default;

const STAGING_BASE_ENDPOINT = "https://staging.6529.io";
const PRODUCTION_BASE_ENDPOINT = "https://6529.io";
const ORIGINAL_PUBLIC_RUNTIME = process.env["PUBLIC_RUNTIME"];
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15";
const WAVE_ID = "5f207393-5418-4a75-8738-e40edb44a94d";

const mockValidatorGate = jest.fn((): Response | undefined => undefined);

jest.mock("@/lib/validator-page/proxyGate", () => ({
  handleValidatorPageGate: () => mockValidatorGate(),
}));

function loadProxy(baseEndpoint: string): Proxy {
  const runtime = JSON.parse(ORIGINAL_PUBLIC_RUNTIME ?? "{}") as Record<
    string,
    unknown
  >;
  process.env["PUBLIC_RUNTIME"] = JSON.stringify({
    ...runtime,
    BASE_ENDPOINT: baseEndpoint,
    API_ENDPOINT: "https://api.staging.example",
  });

  let loaded: Proxy | undefined;
  jest.isolateModules(() => {
    loaded = (require("@/proxy") as { default: Proxy }).default;
  });
  if (!loaded) {
    throw new Error("proxy module did not load");
  }
  return loaded;
}

function request(
  url: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(url, { headers });
}

function mockAccessProbe(status: number) {
  return jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(null, { status }));
}

function expectUncacheable(response: Response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  expect(cacheControl).toContain("private");
  expect(cacheControl).toContain("no-store");
}

describe("proxy response caching", () => {
  beforeEach(() => {
    mockValidatorGate.mockReset();
    mockValidatorGate.mockReturnValue(undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env["PUBLIC_RUNTIME"] = ORIGINAL_PUBLIC_RUNTIME;
  });

  describe("staging access gate", () => {
    it.each([
      [401, "/access"],
      [403, "/restricted"],
    ])(
      "sends the %s redirect to %s as not cacheable",
      async (status, destination) => {
        mockAccessProbe(status);
        const proxy = loadProxy(STAGING_BASE_ENDPOINT);

        const response = await proxy(
          request(`${STAGING_BASE_ENDPOINT}/museum?x=1`, {
            cookie: "x-6529-auth=expired",
          })
        );

        expect(response.status).toBe(307);
        expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
          destination
        );
        expectUncacheable(response);
      }
    );

    it("leaves an allowed page to the route's own caching", async () => {
      mockAccessProbe(200);
      const proxy = loadProxy(STAGING_BASE_ENDPOINT);

      const response = await proxy(
        request(`${STAGING_BASE_ENDPOINT}/museum`, {
          cookie: "x-6529-auth=valid",
        })
      );

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("cache-control")).toBeNull();
    });
  });

  describe("user-agent dependent /my-stream redirect", () => {
    it("is not cacheable on desktop", async () => {
      const proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

      const response = await proxy(
        request(`${PRODUCTION_BASE_ENDPOINT}/my-stream?wave=${WAVE_ID}`, {
          "user-agent": DESKTOP_UA,
        })
      );

      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe(
        `${PRODUCTION_BASE_ENDPOINT}/waves/${WAVE_ID}`
      );
      expectUncacheable(response);
    });

    it("still lets phones through to the page", async () => {
      const proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

      const response = await proxy(
        request(`${PRODUCTION_BASE_ENDPOINT}/my-stream`, {
          "user-agent": IPHONE_UA,
        })
      );

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("location")).toBeNull();
    });
  });

  it("sends the legacy /?wave= redirect as not cacheable", async () => {
    const proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

    const response = await proxy(
      request(`${PRODUCTION_BASE_ENDPOINT}/?wave=${WAVE_ID}`, {
        "user-agent": IPHONE_UA,
      })
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      `${PRODUCTION_BASE_ENDPOINT}/waves/${WAVE_ID}`
    );
    expectUncacheable(response);
  });

  it("sends the error redirect as not cacheable", async () => {
    mockValidatorGate.mockImplementation(() => {
      throw new Error("gate failed");
    });
    const proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

    const response = await proxy(
      request(`${PRODUCTION_BASE_ENDPOINT}/validator`)
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${PRODUCTION_BASE_ENDPOINT}/error`
    );
    expectUncacheable(response);
  });

  it("marks the malformed wave rewrite as not cacheable", async () => {
    const proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

    const response = await proxy(
      request(`${PRODUCTION_BASE_ENDPOINT}/waves/not-a-wave-id`)
    );

    expect(
      new URL(response.headers.get("x-middleware-rewrite") ?? "").pathname
    ).toBe("/wave-not-found");
    expectUncacheable(response);
  });

  it("keeps fixed path redirects cacheable", async () => {
    const proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

    const response = await proxy(
      request(`${PRODUCTION_BASE_ENDPOINT}/privacy-policy`)
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      `${PRODUCTION_BASE_ENDPOINT}/about/privacy-policy`
    );
    expect(response.headers.get("cache-control")).toBeNull();
  });
});
