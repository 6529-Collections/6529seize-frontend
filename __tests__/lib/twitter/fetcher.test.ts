import { fetchTweetPreview } from "@/lib/twitter/fetcher";

const createSyndicationResponse = () =>
  ({
    ok: true,
    status: 200,
    json: async () => ({
      __typename: "Tweet",
      id_str: "2057513333985554492",
      text: "Post text https://t.co/media",
      created_at: "2026-05-21T17:26:20.000Z",
      favorite_count: 7,
      conversation_count: 1,
      user: {
        name: "Mayudrops",
        screen_name: "Mayudropsphotos",
        profile_image_url_https:
          "https://pbs.twimg.com/profile_images/avatar_normal.jpg",
      },
      entities: {
        media: [{ url: "https://t.co/media" }],
      },
      photos: [{ url: "https://pbs.twimg.com/media/example.jpg" }],
      video: {
        poster: "https://pbs.twimg.com/tweet_video_thumb/example.jpg",
        variants: [
          {
            src: "https://video.twimg.com/tweet_video/example.mp4",
          },
        ],
      },
    }),
  }) as Response;

describe("fetchTweetPreview", () => {
  it("fetches Twitter syndication metadata and caches by tweet ID", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(createSyndicationResponse());
    const url = "https://x.com/Mayudropsphotos/status/2057513333985554492";

    const first = await fetchTweetPreview(url, { fetchImpl });
    const second = await fetchTweetPreview(url, { fetchImpl });

    expect(first).toMatchObject({
      tweetId: "2057513333985554492",
      authorName: "Mayudrops",
      text: "Post text",
      mediaImageUrl: "https://pbs.twimg.com/media/example.jpg",
      mediaVideoUrl: "https://video.twimg.com/tweet_video/example.mp4",
      mediaPosterUrl: "https://pbs.twimg.com/tweet_video_thumb/example.jpg",
      authorProfileImageUrl:
        "https://pbs.twimg.com/profile_images/avatar_bigger.jpg",
      createdAtIso: "2026-05-21T17:26:20.000Z",
      favoriteCount: 7,
      conversationCount: 1,
    });
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const endpoint = fetchImpl.mock.calls[0]?.[0] as URL | undefined;
    expect(endpoint?.toString()).toContain(
      "https://cdn.syndication.twimg.com/tweet-result"
    );
    expect(endpoint?.searchParams.get("id")).toBe("2057513333985554492");
    expect(endpoint?.searchParams.get("token")).toBeTruthy();
  });

  it("does not treat arbitrary hosts containing twimg.com as Twitter media", async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        __typename: "Tweet",
        id_str: "2057513333985554492",
        text: "Post text",
        user: {
          name: "Mayudrops",
          screen_name: "Mayudropsphotos",
        },
        photos: [{ url: "https://twimg.com.evil.example/media/post.jpg" }],
      }),
    } as Response);

    const preview = await fetchTweetPreview(
      "https://x.com/Mayudropsphotos/status/2057513333985554492",
      { fetchImpl }
    );

    expect(preview.mediaImageUrl).toBeUndefined();
  });
});
