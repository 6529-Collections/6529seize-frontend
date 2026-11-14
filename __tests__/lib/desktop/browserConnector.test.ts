import {
  BROWSER_CONNECTOR_TIMEOUT_MS,
  buildBrowserConnectorDeepLink,
  buildBrowserConnectorUrl,
  createBrowserConnectorRequestId,
  normalizeDesktopScheme,
  parseBrowserConnectorRequest,
  parseBrowserConnectorResult,
} from "@/lib/desktop/browserConnector";

const NOW = 1_800_000_000_000;
const REQUEST_ID = "abcdefghijklmnopqrstuvwxyz012345";
const ADDRESS = `0x${"a".repeat(40)}`;

const params = (values: Record<string, string>) => new URLSearchParams(values);

const validResult = (overrides: Record<string, unknown> = {}) => ({
  requestId: REQUEST_ID,
  data: {
    kind: "desktop-sign-in",
    address: ADDRESS,
    server_signature: "0xserver",
    client_signature: `0x${"b".repeat(130)}`,
    ...overrides,
  },
});

describe("normalizeDesktopScheme", () => {
  it("accepts only the 6529 Desktop schemes", () => {
    expect(normalizeDesktopScheme("localcore6529")).toBe("localcore6529");
    expect(normalizeDesktopScheme(" CORE6529 ")).toBe("core6529");
    for (const value of ["https", "core6529x", "", null, 42]) {
      expect(normalizeDesktopScheme(value)).toBeNull();
    }
  });
});

describe("request ids and URLs", () => {
  it("creates unguessable URL-safe request ids", () => {
    const first = createBrowserConnectorRequestId();
    expect(first).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(createBrowserConnectorRequestId()).not.toBe(first);
  });

  it("builds the page URL on the given origin", () => {
    expect(
      buildBrowserConnectorUrl({
        origin: "http://localhost:6529",
        scheme: "localcore6529",
        requestId: REQUEST_ID,
        expiresAt: NOW,
      })
    ).toBe(
      `http://localhost:6529/browser-connector?scheme=localcore6529&request=${REQUEST_ID}&expires=${NOW}`
    );
  });
});

describe("parseBrowserConnectorRequest", () => {
  const valid = {
    scheme: "localcore6529",
    request: REQUEST_ID,
    expires: String(NOW + 60_000),
  };

  it("accepts a valid request", () => {
    expect(parseBrowserConnectorRequest(params(valid), NOW)).toEqual({
      ok: true,
      scheme: "localcore6529",
      requestId: REQUEST_ID,
      expiresAt: NOW + 60_000,
    });
  });

  it("refuses a scheme outside the 6529 Desktop schemes", () => {
    expect(
      parseBrowserConnectorRequest(params({ ...valid, scheme: "evil" }), NOW)
    ).toEqual({ ok: false, problem: "invalid-scheme" });
  });

  it("refuses malformed request ids and expiry", () => {
    for (const bad of [
      { request: "short" },
      { request: "has spaces in it which are not allowed" },
      { expires: "soon" },
    ]) {
      expect(
        parseBrowserConnectorRequest(params({ ...valid, ...bad }), NOW)
      ).toEqual({ ok: false, problem: "invalid-request" });
    }
  });

  it("accepts any 6529 Desktop scheme the app reported", () => {
    for (const scheme of ["localcore6529", "stagingcore6529", "core6529"]) {
      expect(
        parseBrowserConnectorRequest(params({ ...valid, scheme }), NOW).ok
      ).toBe(true);
    }
  });

  it("refuses expired or implausibly long-lived links", () => {
    expect(
      parseBrowserConnectorRequest(
        params({ ...valid, expires: String(NOW) }),
        NOW
      )
    ).toEqual({ ok: false, problem: "expired" });
    expect(
      parseBrowserConnectorRequest(
        params({
          ...valid,
          expires: String(NOW + BROWSER_CONNECTOR_TIMEOUT_MS * 3),
        }),
        NOW
      )
    ).toEqual({ ok: false, problem: "expired" });
  });
});

describe("deep link round trip", () => {
  it("builds a link whose data parses back to the same result", () => {
    const result = {
      requestId: REQUEST_ID,
      address: ADDRESS,
      serverSignature: "0xserver",
      clientSignature: `0x${"b".repeat(130)}`,
    };
    const link = buildBrowserConnectorDeepLink("localcore6529", result);

    expect(link.startsWith("localcore6529://connector?data=")).toBe(true);
    const data: unknown = JSON.parse(
      decodeURIComponent(link.split("data=")[1] ?? "")
    );
    expect(parseBrowserConnectorResult(data)).toEqual(result);
  });
});

describe("parseBrowserConnectorResult", () => {
  it("lower-cases the address", () => {
    expect(
      parseBrowserConnectorResult(
        validResult({ address: `0x${"A".repeat(40)}` })
      )?.address
    ).toBe(ADDRESS);
  });

  it.each([
    ["not an object", "x"],
    ["an array", []],
    ["a missing request id", { data: validResult().data }],
    ["a malformed request id", { ...validResult(), requestId: "short" }],
    ["another kind", validResult({ kind: "rpc-response" })],
    ["an invalid address", validResult({ address: "0x123" })],
    ["a non-hex client signature", validResult({ client_signature: "nope" })],
    [
      "an oversized server signature",
      validResult({ server_signature: "a".repeat(5_000) }),
    ],
    [
      "a server signature with markup",
      validResult({ server_signature: "<script>" }),
    ],
    ["an oversized payload", { ...validResult(), extra: "x".repeat(20_000) }],
  ])("refuses %s", (_name, value) => {
    expect(parseBrowserConnectorResult(value)).toBeNull();
  });
});
