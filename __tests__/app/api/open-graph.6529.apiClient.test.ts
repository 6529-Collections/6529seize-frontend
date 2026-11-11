/**
 * @jest-environment node
 */

const mockSsrFetch = jest.fn();
const mockAnonymousSsrFetch = jest.fn();

jest.mock("@/lib/fetch/ssrFetch", () => ({
  ssrFetch: (...args: unknown[]) => mockSsrFetch(...args),
  anonymousSsrFetch: (...args: unknown[]) => mockAnonymousSsrFetch(...args),
}));

jest.mock("@/config/serverEnv", () => ({
  getStagingApiKey: jest.fn(() => undefined),
}));

jest.mock("@/services/api/api-endpoints", () => ({
  getApiBase: () => "https://api.6529.io",
  PUBLIC_PRODUCTION_API_BASE: "https://api.6529.io",
}));

import {
  fetchOptionalApiJson,
  getCacheAuthScope,
} from "@/app/api/open-graph/6529/apiClient";

describe("first-party preview API client", () => {
  beforeEach(() => {
    mockSsrFetch.mockReset();
    mockAnonymousSsrFetch.mockReset();
  });

  it("fetches server-side preview data without the viewer's wallet session", async () => {
    mockAnonymousSsrFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1 }))
    );

    await expect(
      fetchOptionalApiJson("nfts", { id: 1 }, { apiAuth: "staging-access" })
    ).resolves.toEqual({ id: 1 });

    expect(mockSsrFetch).not.toHaveBeenCalled();
    expect(mockAnonymousSsrFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockAnonymousSsrFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.6529.io/api/nfts?id=1");
    expect(new Headers(init.headers).get("authorization")).toBeNull();
    expect(new Headers(init.headers).get("x-6529-auth")).toBe("staging-access");
  });

  it("scopes cached previews only by the API access header", () => {
    expect(getCacheAuthScope()).toBe("public");
    expect(getCacheAuthScope({ apiAuth: "a" })).toMatch(/^auth:[a-f0-9]{24}$/);
    expect(getCacheAuthScope({ apiAuth: "a" })).not.toBe(
      getCacheAuthScope({ apiAuth: "b" })
    );
  });
});
