import {
  detectBlueskyTarget,
  fetchBlueskyPreview,
} from "../../app/api/open-graph/bluesky";

describe("detectBlueskyTarget", () => {
  it("identifies Bluesky post URLs", () => {
    const target = detectBlueskyTarget(
      new URL("https://bsky.app/profile/example.com/post/abc123")
    );

    expect(target).toEqual({
      kind: "post",
      identifier: "example.com",
      rkey: "abc123",
      normalizedUrl: "https://bsky.app/profile/example.com/post/abc123",
    });
  });

  it("identifies Bluesky profiles", () => {
    const target = detectBlueskyTarget(
      new URL("https://www.bsky.app/profile/did:plc:123")
    );

    expect(target).toEqual({
      kind: "profile",
      identifier: "did:plc:123",
      normalizedUrl: "https://bsky.app/profile/did:plc:123",
    });
  });

  it("returns null for unsupported URLs", () => {
    expect(
      detectBlueskyTarget(new URL("https://example.com/profile/handle"))
    ).toBeNull();

    expect(
      detectBlueskyTarget(
        new URL("https://bsky.app/profile/example.com/followers")
      )
    ).toBeNull();
  });
});

describe("fetchBlueskyPreview", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("fetches and normalizes Bluesky posts", async () => {
    const target = detectBlueskyTarget(
      new URL("https://bsky.app/profile/example.com/post/abc123")
    );
    expect(target).not.toBeNull();

    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(createJsonResponse({ did: "did:plc:123" }));
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        thread: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: "at://did:plc:123/app.bsky.feed.post/abc123",
            author: {
              did: "did:plc:123",
              handle: "example.com",
              displayName: "Example User",
              avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:123/avatar@jpeg",
            },
            record: {
              text: "Hello world",
              createdAt: "2024-01-01T00:00:00.000Z",
            },
            replyCount: 2,
            repostCount: 4,
            likeCount: 8,
            embed: {
              $type: "app.bsky.embed.images#view",
              images: [
                {
                  thumb:
                    "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:123/thumb@jpeg",
                  fullsize:
                    "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:123/full@jpeg",
                  alt: "Sample image",
                },
              ],
            },
            labels: [{ val: "nsfw" }],
          },
        },
      })
    );

    const result = await fetchBlueskyPreview(target!);
    expect(result.ttlMs).toBe(20 * 60 * 1000);
    expect(result.data.type).toBe("bluesky.post");
    expect(result.data.post).toMatchObject({
      text: "Hello world",
      labels: ["nsfw"],
      images: [
        expect.objectContaining({
          thumb:
            "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:123/thumb@jpeg",
        }),
      ],
    });
    expect(result.data.post?.counts).toEqual({
      replies: 2,
      reposts: 4,
      likes: 8,
    });
  });

  it("fetches Bluesky profiles", async () => {
    const target = detectBlueskyTarget(
      new URL("https://bsky.app/profile/example.com")
    );
    expect(target).not.toBeNull();

    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        did: "did:plc:123",
        handle: "example.com",
        displayName: "Example",
        followersCount: 10,
        followsCount: 20,
        postsCount: 30,
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:123/avatar@jpeg",
      })
    );

    const result = await fetchBlueskyPreview(target!);
    expect(result.ttlMs).toBe(24 * 60 * 60 * 1000);
    expect(result.data.type).toBe("bluesky.profile");
    expect(result.data.profile).toMatchObject({
      handle: "example.com",
      counts: { followers: 10, follows: 20, posts: 30 },
    });
  });

  it("fetches Bluesky feed generators", async () => {
    const target = detectBlueskyTarget(
      new URL("https://bsky.app/profile/example.com/feed/whats-hot")
    );
    expect(target).not.toBeNull();

    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(createJsonResponse({ did: "did:plc:123" }));
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        view: {
          uri: "at://did:plc:123/app.bsky.feed.generator/whats-hot",
          displayName: "Discover",
          description: "Trending content",
          avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:123/feed@jpeg",
          creator: {
            did: "did:plc:123",
            handle: "example.com",
            displayName: "Example",
            avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:123/avatar@jpeg",
          },
        },
      })
    );

    const result = await fetchBlueskyPreview(target!);
    expect(result.ttlMs).toBe(24 * 60 * 60 * 1000);
    expect(result.data.type).toBe("bluesky.feed");
    expect(result.data.feed).toMatchObject({
      displayName: "Discover",
      creator: expect.objectContaining({ handle: "example.com" }),
    });
  });

  it("returns an unavailable payload when the handle cannot be resolved", async () => {
    const target = detectBlueskyTarget(
      new URL("https://bsky.app/profile/missing.com/feed/abc")
    );
    expect(target).not.toBeNull();

    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValueOnce(createErrorResponse(404));

    const result = await fetchBlueskyPreview(target!);
    expect(result.data.type).toBe("bluesky.unavailable");
    expect(result.ttlMs).toBe(5 * 60 * 1000);
  });
});

function createJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as any;
}

function createErrorResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({ message: "error" }),
  } as any;
}
