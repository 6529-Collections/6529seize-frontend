import type { NextRequest } from "next/server";

const mockNextResponseJson = jest.fn(
  (body: unknown, init?: { status?: number | undefined }) => ({
    status: init?.status ?? 200,
    json: async () => body,
  })
);

const mockFetchTweetPreview = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: { json: mockNextResponseJson },
}));

jest.mock("@/lib/twitter", () => ({
  fetchTweetPreview: mockFetchTweetPreview,
}));

const postRequest = (body: unknown, clientIp?: string) => {
  const encoded = new TextEncoder().encode(
    typeof body === "string" ? body : JSON.stringify(body)
  );
  let read = false;
  const request = {
    headers: new Headers(clientIp ? { "x-forwarded-for": clientIp } : {}),
    body: {
      getReader: () => ({
        read: async () => {
          if (read) {
            return { done: true, value: undefined };
          }
          read = true;
          return { done: false, value: encoded };
        },
      }),
    },
  };
  return request as unknown as NextRequest;
};

describe("twitter preview API route", () => {
  beforeEach(() => {
    jest.resetModules();
    mockNextResponseJson.mockClear();
    mockFetchTweetPreview.mockReset();
  });

  it("returns normalized Twitter preview metadata", async () => {
    mockFetchTweetPreview.mockResolvedValue({
      tweetId: "2057513333985554492",
      url: "https://x.com/Mayudropsphotos/status/2057513333985554492",
      authorName: "Mayudrops",
      text: "Post text",
    });

    const { GET } = await import("../../../app/api/twitter/preview/route");
    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL(
        "https://app.local/api/twitter/preview?url=https://x.com/Mayudropsphotos/status/2057513333985554492"
      ),
    } as any);

    expect(response.status).toBe(200);
    expect(mockFetchTweetPreview).toHaveBeenCalledWith(
      "https://x.com/Mayudropsphotos/status/2057513333985554492"
    );
    await expect(response.json()).resolves.toMatchObject({
      tweetId: "2057513333985554492",
      text: "Post text",
    });
  });

  it("returns an error when the URL is missing", async () => {
    const { GET } = await import("../../../app/api/twitter/preview/route");
    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL("https://app.local/api/twitter/preview"),
    } as any);

    expect(response.status).toBe(400);
    expect(mockFetchTweetPreview).not.toHaveBeenCalled();
  });

  it("returns a client error when the Twitter URL is invalid", async () => {
    mockFetchTweetPreview.mockRejectedValue(
      new Error("Invalid Twitter/X status URL.")
    );

    const { GET } = await import("../../../app/api/twitter/preview/route");
    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL("https://app.local/api/twitter/preview?url=not-a-tweet"),
    } as any);

    expect(response.status).toBe(400);
    expect(mockFetchTweetPreview).toHaveBeenCalledWith("not-a-tweet");
  });

  it("returns an upstream error when Twitter metadata fetch fails", async () => {
    mockFetchTweetPreview.mockRejectedValue(new Error("upstream failed"));

    const { GET } = await import("../../../app/api/twitter/preview/route");
    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL(
        "https://app.local/api/twitter/preview?url=https://twitter.com/Mayudropsphotos/status/2057513333985554492"
      ),
    } as any);

    expect(response.status).toBe(502);
    expect(mockFetchTweetPreview).toHaveBeenCalledWith(
      "https://twitter.com/Mayudropsphotos/status/2057513333985554492"
    );
  });

  it("returns POST batch results and per-url errors", async () => {
    const goodUrl = "https://x.com/Mayudropsphotos/status/2057513333985554492";
    mockFetchTweetPreview.mockImplementation(async (url: string) => {
      if (url === "not-a-tweet") {
        throw new Error("Invalid Twitter/X status URL.");
      }

      return {
        tweetId: "2057513333985554492",
        url,
        text: "Post text",
      };
    });

    const { POST } = await import("../../../app/api/twitter/preview/route");
    const response = await POST(
      postRequest({
        urls: [` ${goodUrl} `, "not-a-tweet", goodUrl],
      })
    );
    const body = (await response.json()) as {
      readonly results: Record<string, unknown>;
      readonly errors: Record<string, string | undefined>;
    };

    expect(response.status).toBe(200);
    expect(mockFetchTweetPreview).toHaveBeenCalledTimes(2);
    expect(mockFetchTweetPreview).toHaveBeenCalledWith(goodUrl);
    expect(mockFetchTweetPreview).toHaveBeenCalledWith("not-a-tweet");
    expect(body.results[goodUrl]).toMatchObject({
      tweetId: "2057513333985554492",
      text: "Post text",
    });
    expect(body.errors["not-a-tweet"]).toBe("Invalid Twitter/X status URL.");
  });

  it("returns an error when the POST batch has no URLs", async () => {
    const { POST } = await import("../../../app/api/twitter/preview/route");
    const response = await POST(postRequest({ urls: [] }));

    expect(response.status).toBe(400);
    expect(mockFetchTweetPreview).not.toHaveBeenCalled();
  });

  it("returns an error when the POST batch exceeds the URL limit", async () => {
    const urls = Array.from(
      { length: 6 },
      (_value, index) => `https://x.com/user/status/${index + 1}`
    );

    const { POST } = await import("../../../app/api/twitter/preview/route");
    const response = await POST(postRequest({ urls }));

    expect(response.status).toBe(400);
    expect(mockFetchTweetPreview).not.toHaveBeenCalled();
  });

  it("rejects oversized and malformed POST bodies before fetching", async () => {
    const { POST } = await import("../../../app/api/twitter/preview/route");
    const oversized = await POST(
      postRequest({ urls: ["https://x.com/a/status/1".padEnd(9000, "1")] })
    );
    const malformed = await POST(postRequest("{not json"));

    expect(oversized.status).toBe(413);
    expect(malformed.status).toBe(400);
    expect(mockFetchTweetPreview).not.toHaveBeenCalled();
  });

  it("limits each client to its per-minute preview budget, counting batch URLs", async () => {
    mockFetchTweetPreview.mockResolvedValue({ tweetId: "1", url: "u" });
    const { GET, POST } =
      await import("../../../app/api/twitter/preview/route");
    const urls = Array.from(
      { length: 5 },
      (_value, index) => `https://x.com/user/status/${index + 1}`
    );

    for (let index = 0; index < 48; index += 1) {
      const batch = await POST(postRequest({ urls }, "8.8.4.20"));
      expect(batch.status).toBe(200);
    }
    const limited = await GET({
      headers: new Headers({ "x-forwarded-for": "8.8.4.20" }),
      nextUrl: new URL(
        "https://app.local/api/twitter/preview?url=https://x.com/a/status/1"
      ),
    } as any);
    const otherClient = await POST(postRequest({ urls }, "8.8.4.21"));

    expect(limited.status).toBe(429);
    expect(otherClient.status).toBe(200);
  });
});
