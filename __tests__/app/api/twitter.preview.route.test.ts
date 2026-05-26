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
      nextUrl: new URL("https://app.local/api/twitter/preview?url=not-a-tweet"),
    } as any);

    expect(response.status).toBe(400);
    expect(mockFetchTweetPreview).toHaveBeenCalledWith("not-a-tweet");
  });

  it("returns an upstream error when Twitter metadata fetch fails", async () => {
    mockFetchTweetPreview.mockRejectedValue(new Error("upstream failed"));

    const { GET } = await import("../../../app/api/twitter/preview/route");
    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/twitter/preview?url=https://twitter.com/Mayudropsphotos/status/2057513333985554492"
      ),
    } as any);

    expect(response.status).toBe(502);
    expect(mockFetchTweetPreview).toHaveBeenCalledWith(
      "https://twitter.com/Mayudropsphotos/status/2057513333985554492"
    );
  });
});
