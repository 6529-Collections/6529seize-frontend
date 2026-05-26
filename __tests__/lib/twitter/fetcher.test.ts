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
      retweet_count: 2,
      bookmark_count: "3",
      view_count: "137",
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
      media: [
        {
          type: "image",
          imageUrl: "https://pbs.twimg.com/media/example.jpg",
        },
        {
          type: "video",
          videoUrl: "https://video.twimg.com/tweet_video/example.mp4",
          posterUrl: "https://pbs.twimg.com/tweet_video_thumb/example.jpg",
        },
      ],
      authorProfileImageUrl:
        "https://pbs.twimg.com/profile_images/avatar_bigger.jpg",
      createdAtIso: "2026-05-21T17:26:20.000Z",
      favoriteCount: 7,
      conversationCount: 1,
      retweetCount: 2,
      bookmarkCount: 3,
      viewCount: 137,
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
    const response = {
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
    };
    const fetchImpl = jest.fn().mockResolvedValueOnce(response);

    const preview = await fetchTweetPreview(
      "https://x.com/Mayudropsphotos/status/2057513333985554492",
      { fetchImpl }
    );

    expect(preview.mediaImageUrl).toBeUndefined();
  });

  it("prefers MP4 video variants when multiple formats are available", async () => {
    const response = {
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
        video: {
          variants: [
            {
              src: "https://video.twimg.com/tweet_video/example.m3u8",
              content_type: "application/x-mpegURL",
            },
            {
              src: "https://video.twimg.com/tweet_video/example.mp4",
              content_type: "video/mp4",
            },
          ],
        },
      }),
    };
    const fetchImpl = jest.fn().mockResolvedValueOnce(response);

    const preview = await fetchTweetPreview(
      "https://x.com/Mayudropsphotos/status/2057513333985554492",
      { fetchImpl }
    );

    expect(preview.mediaVideoUrl).toBe(
      "https://video.twimg.com/tweet_video/example.mp4"
    );
  });

  it("collects multiple syndication media items for gallery tweets", async () => {
    const response = {
      ok: true,
      status: 200,
      json: async () => ({
        __typename: "Tweet",
        id_str: "2058813617554723314",
        text: "Gallery tweet",
        user: {
          name: "CasaNUA.6529",
          screen_name: "Casa_NUA",
        },
        mediaDetails: [
          {
            media_url_https: "https://pbs.twimg.com/media/photo-one.jpg",
          },
          {
            media_url_https: "https://pbs.twimg.com/media/video-poster.jpg",
            video_info: {
              variants: [
                {
                  url: "https://video.twimg.com/ext_tw_video/video-one.mp4",
                  content_type: "video/mp4",
                },
              ],
            },
          },
          {
            media_url_https: "https://pbs.twimg.com/media/photo-two.jpg",
          },
        ],
      }),
    };
    const fetchImpl = jest.fn().mockResolvedValueOnce(response);

    const preview = await fetchTweetPreview(
      "https://x.com/Casa_NUA/status/2058813617554723314",
      { fetchImpl }
    );

    expect(preview.media).toEqual([
      {
        type: "image",
        imageUrl: "https://pbs.twimg.com/media/photo-one.jpg",
      },
      {
        type: "video",
        videoUrl: "https://video.twimg.com/ext_tw_video/video-one.mp4",
        posterUrl: "https://pbs.twimg.com/media/video-poster.jpg",
      },
      {
        type: "image",
        imageUrl: "https://pbs.twimg.com/media/photo-two.jpg",
      },
    ]);
  });

  it("removes hidden reply prefixes without truncating expanded tweet text", async () => {
    const hiddenPrefix = "@punk6529 ";
    const fullText = `${hiddenPrefix}5/ 6529 Seizing is the NFT that inaugurates The Memes by 6529.\n\nHere sharing a display with @Viva_La_Vandal and @BillyNFTees.`;
    const response = {
      ok: true,
      status: 200,
      json: async () => ({
        __typename: "Tweet",
        id_str: "2058813617554723314",
        full_text: fullText,
        display_text_range: [hiddenPrefix.length, fullText.length - 32],
        in_reply_to_screen_name: "Casa_NUA",
        user: {
          name: "CasaNUA.6529",
          screen_name: "Casa_NUA",
        },
      }),
    };
    const fetchImpl = jest.fn().mockResolvedValueOnce(response);

    const preview = await fetchTweetPreview(
      "https://x.com/Casa_NUA/status/2058813617554723314",
      { fetchImpl }
    );

    expect(preview).toMatchObject({
      text: "5/ 6529 Seizing is the NFT that inaugurates The Memes by 6529.\n\nHere sharing a display with @Viva_La_Vandal and @BillyNFTees.",
      replyToHandle: "Casa_NUA",
    });
  });

  it("marks unfinished short syndication text with an ellipsis", async () => {
    const hiddenPrefix = "@punk6529 ";
    const response = {
      ok: true,
      status: 200,
      json: async () => ({
        __typename: "Tweet",
        id_str: "2058813617554723314",
        text: `${hiddenPrefix}Here sharing a display with @Viva_La_Vandal's Meme Enjoyoor and @BillyNFTees' The Sacrifice of the Memes, two`,
        display_text_range: [hiddenPrefix.length, 126],
        user: {
          name: "CasaNUA.6529",
          screen_name: "Casa_NUA",
        },
      }),
    };
    const fetchImpl = jest.fn().mockResolvedValueOnce(response);

    const preview = await fetchTweetPreview(
      "https://x.com/Casa_NUA/status/2058813617554723314",
      { fetchImpl }
    );

    expect(preview.text).toBe(
      "Here sharing a display with @Viva_La_Vandal's Meme Enjoyoor and @BillyNFTees' The Sacrifice of the Memes, two..."
    );
  });

  it("limits long expanded tweet text to a 260 character excerpt", async () => {
    const longText = [
      "5/ 6529 Seizing is the NFT that inaugurates The Memes by 6529, a close-up of @punk6529's Cryptopunk NFT with the words Seize the Memes of Production occupying the pixels on its mouth.",
      "Here sharing a display with @Viva_La_Vandal's Meme Enjoyoor and @BillyNFTees' The Sacrifice of the Memes, two irreverent derivatives of Punk 6529's persona.",
      "Auction proceeds will be shared between artist and Casa NUA.",
    ].join("\n\n");
    const response = {
      ok: true,
      status: 200,
      json: async () => ({
        __typename: "Tweet",
        id_str: "2058813617554723314",
        full_text: longText,
        user: {
          name: "CasaNUA.6529",
          screen_name: "Casa_NUA",
        },
      }),
    };
    const fetchImpl = jest.fn().mockResolvedValueOnce(response);

    const preview = await fetchTweetPreview(
      "https://x.com/Casa_NUA/status/2058813617554723314",
      { fetchImpl }
    );

    expect(preview.text).toMatch(/\.\.\.$/u);
    expect(Array.from(preview.text ?? "").length).toBeLessThanOrEqual(263);
  });
});
