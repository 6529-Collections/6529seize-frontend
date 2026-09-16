/** @jest-environment node */

const mockNativeFetch = jest.fn();
const mockGetAppCommonHeaders = jest.fn();

jest.mock("@/config/env", () => ({
  publicEnv: { API_ENDPOINT: "https://api.example.test" },
}));
jest.mock("@/config/serverEnv", () => ({
  getServerEnvOrThrow: () => {
    const signingValueKey = ["SSR_CLIENT", "SECRET"].join("_");
    return {
      SSR_CLIENT_ID: "client-id",
      [signingValueKey]: "fixture-signing-value",
    };
  },
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

describe("anonymousSsrFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockNativeFetch.mockResolvedValue(new Response(null, { status: 204 }));
    mockGetAppCommonHeaders.mockResolvedValue({
      Authorization: "Bearer viewer-wallet",
      "x-6529-auth": "environment-access",
    });
    globalThis.fetch = mockNativeFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("preserves environment access and SSR signatures without forwarding wallet auth", async () => {
    const { anonymousSsrFetch } = await import("@/lib/fetch/ssrFetch");

    await anonymousSsrFetch("https://api.example.test/api/public-feed", {
      headers: {
        Authorization: "Bearer explicitly-provided-wallet",
        "x-caller": "server-render",
      },
    });

    expect(mockNativeFetch).toHaveBeenCalledTimes(1);
    const requestInit = mockNativeFetch.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("x-6529-auth")).toBe("environment-access");
    expect(headers.get("x-6529-internal-id")).toBe("client-id");
    expect(headers.get("x-6529-internal-signature")).toBe("request-signature");
    expect(headers.get("x-caller")).toBe("server-render");
  });
});
