/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

const mockFetchPublicUrl = jest.fn();

jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    // Host policy only; the tests never resolve DNS.
    assertPublicUrl: jest.fn(
      async (
        url: URL,
        options: { policy?: { allowedHosts?: readonly string[] } }
      ) => {
        if (!options.policy?.allowedHosts?.includes(url.hostname)) {
          throw new actual.UrlGuardError(
            "Host not allowed",
            "host-not-allowed",
            400
          );
        }
      }
    ),
    fetchPublicUrl: (...args: unknown[]) => mockFetchPublicUrl(...args),
  };
});

type RouteModule = typeof import("@/app/api/tiktok/route");

const VIDEO_URL = "https://www.tiktok.com/@creator/video/7234567890123456789";

const requestFor = (url: string, clientIp = "8.8.4.30"): NextRequest =>
  ({
    headers: new Headers({ "x-forwarded-for": clientIp }),
    nextUrl: new URL(
      `https://app.local/api/tiktok?url=${encodeURIComponent(url)}`
    ),
  }) as unknown as NextRequest;

const oEmbedResponse = () =>
  new Response(JSON.stringify({ author_name: "Creator", title: "A clip" }), {
    headers: { "content-type": "application/json" },
  });

const redirectedTo = (url: string) => {
  const response = new Response(null, { status: 200 });
  Object.defineProperty(response, "url", { value: url });
  return response;
};

describe("TikTok preview route", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();
  let GET: RouteModule["GET"];

  beforeEach(async () => {
    jest.resetModules();
    fetchMock.mockReset();
    mockFetchPublicUrl.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    ({ GET } = await import("@/app/api/tiktok/route"));
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("resolves a share link once and previews the TikTok page it points to", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(redirectedTo(VIDEO_URL));
    fetchMock.mockResolvedValueOnce(oEmbedResponse());

    const response = await GET(requestFor("https://vm.tiktok.com/ZMabc123/"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      kind: "video",
      canonicalUrl: VIDEO_URL,
      title: "A clip",
    });
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
  });

  it("stops when a share link resolves to another share link", async () => {
    mockFetchPublicUrl.mockImplementation(async () =>
      redirectedTo("https://vt.tiktok.com/ZMnext/")
    );

    const response = await GET(requestFor("https://vm.tiktok.com/ZMloop/"));

    expect(response.status).toBe(400);
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits each client to its per-minute preview budget", async () => {
    fetchMock.mockImplementation(async () => oEmbedResponse());

    let response: Response | undefined;
    for (let index = 0; index < 121; index += 1) {
      response = await GET(requestFor(VIDEO_URL));
    }
    const otherClient = await GET(requestFor(VIDEO_URL, "8.8.4.31"));

    expect(response?.status).toBe(429);
    expect(otherClient.status).toBe(200);
    // The rest were served from the preview cache.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
