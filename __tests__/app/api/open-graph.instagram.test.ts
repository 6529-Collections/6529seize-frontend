import {
  __clearInstagramCacheForTests,
  handleInstagramRequest,
} from "../../../app/api/open-graph/instagram";

const originalFetch = global.fetch;
const originalToken = process.env.IG_OEMBED_GRAPH_TOKEN;
const originalVersion = process.env.IG_OEMBED_GRAPH_VERSION;

describe("instagram link preview handler", () => {
  beforeEach(() => {
    __clearInstagramCacheForTests();
    process.env.IG_OEMBED_GRAPH_TOKEN = "test-token";
    delete process.env.IG_OEMBED_GRAPH_VERSION;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    __clearInstagramCacheForTests();
    process.env.IG_OEMBED_GRAPH_TOKEN = originalToken;
    process.env.IG_OEMBED_GRAPH_VERSION = originalVersion;
    global.fetch = originalFetch;
  });

  it("returns null when URL is not Instagram", async () => {
    const result = await handleInstagramRequest(new URL("https://example.com"));
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns protected stub for stories without calling oEmbed", async () => {
    const result = await handleInstagramRequest(
      new URL("https://www.instagram.com/stories/user/123456/")
    );

    expect(result).toEqual({
      status: 200,
      body: {
        instagram: {
          canonicalUrl: "https://instagram.com/stories/user/123456/",
          resource: "story",
          status: "protected",
          username: "user",
        },
      },
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("normalizes pass-through URLs before requesting oEmbed", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        author_name: "Creator",
        author_url: "https://www.instagram.com/creator/",
        title: "<p>Hello</p>",
        thumbnail_url: "https://cdninstagram.com/preview.jpg",
        thumbnail_width: 640,
        thumbnail_height: 640,
        upload_date: "2023-09-01T12:00:00Z",
      }),
    });
    global.fetch = fetchMock as any;

    const result = await handleInstagramRequest(
      new URL(
        "https://l.instagram.com/?u=" +
          encodeURIComponent("https://www.instagram.com/p/abc/?utm_source=foo")
      )
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const endpoint = new URL(fetchMock.mock.calls[0][0]);
    expect(endpoint.pathname).toBe("/v20.0/instagram_oembed");
    expect(endpoint.searchParams.get("url")).toBe(
      "https://instagram.com/p/abc/"
    );
    expect(endpoint.searchParams.get("access_token")).toBe("test-token");

    expect(result).toEqual({
      status: 200,
      body: {
        instagram: expect.objectContaining({
          canonicalUrl: "https://instagram.com/p/abc/",
          resource: "post",
          status: "available",
          authorName: "Creator",
          authorUrl: "https://instagram.com/creator/",
          caption: "Hello",
          username: "creator",
        }),
      },
    });

    const second = await handleInstagramRequest(
      new URL("https://www.instagram.com/p/abc/")
    );
    expect(second).toEqual(result);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches unavailable responses", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Not found" } }),
    });
    global.fetch = fetchMock as any;

    const target = new URL("https://www.instagram.com/p/missing/");

    const first = await handleInstagramRequest(target);
    expect(first).toEqual({
      status: 404,
      body: {
        error: "unavailable",
        instagram: {
          canonicalUrl: "https://instagram.com/p/missing/",
          resource: "post",
          status: "unavailable",
          username: null,
        },
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await handleInstagramRequest(target);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null when access token is not configured", async () => {
    delete process.env.IG_OEMBED_GRAPH_TOKEN;

    const result = await handleInstagramRequest(
      new URL("https://www.instagram.com/p/abc/")
    );

    expect(result).toBeNull();
  });
});
