import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TwitterPreviewCard from "@/components/waves/TwitterPreviewCard";
import { fetchTwitterPreview } from "@/services/api/twitter-preview-api";

jest.mock("@/services/api/twitter-preview-api", () => ({
  fetchTwitterPreview: jest.fn(),
}));

jest.mock("@/components/waves/LinkPreviewContext", () => ({
  useLinkPreviewContext: () => ({ hideActions: false }),
}));

const mockedFetchTwitterPreview = fetchTwitterPreview as jest.MockedFunction<
  typeof fetchTwitterPreview
>;

describe("TwitterPreviewCard", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => undefined);
    jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    jest
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    mockedFetchTwitterPreview.mockReset();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders oEmbed metadata in a tweet-like card", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2049202644879565155",
      url: "https://x.com/Mayudropsphotos/status/2049202644879565155",
      authorName: "Mayudrops",
      authorUrl: "https://twitter.com/Mayudropsphotos",
      authorHandle: "Mayudropsphotos",
      authorProfileImageUrl: "https://pbs.twimg.com/profile_images/avatar.jpg",
      text: "These jobs won't be here forever.",
      mediaLink: "https://t.co/example",
      mediaImageUrl: "https://pbs.twimg.com/media/example.jpg",
      createdAtIso: "2026-04-28T19:02:00.000Z",
      favoriteCount: 94626,
      conversationCount: 3951,
      retweetCount: 2,
      bookmarkCount: 1,
      viewCount: 137,
    });

    render(
      <TwitterPreviewCard
        href="https://x.com/Mayudropsphotos/status/2049202644879565155"
        tweetId="2049202644879565155"
      />
    );

    expect(screen.getByTestId("twitter-post-skeleton")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("twitter-post-preview")).toBeInTheDocument();
    });

    expect(screen.getByText("Mayudrops")).toBeInTheDocument();
    expect(screen.getByText(/@Mayudropsphotos/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Follow" })).toHaveAttribute(
      "href",
      "https://x.com/intent/follow?screen_name=Mayudropsphotos"
    );
    expect(
      screen.getByText("These jobs won't be here forever.")
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Mayudrops" })).toHaveAttribute(
      "src",
      "https://pbs.twimg.com/profile_images/avatar.jpg"
    );
    expect(
      screen.getByRole("img", { name: "These jobs won't be here forever." })
    ).toHaveAttribute("src", "https://pbs.twimg.com/media/example.jpg");
    expect(screen.getByText(/· Apr 28, 2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Like" })).toHaveAttribute(
      "href",
      "https://x.com/intent/like?tweet_id=2049202644879565155"
    );
    expect(screen.getByRole("link", { name: "Reply" })).toHaveAttribute(
      "href",
      "https://x.com/intent/tweet?in_reply_to=2049202644879565155"
    );
    expect(screen.getByRole("link", { name: "Repost" })).toHaveAttribute(
      "href",
      "https://x.com/intent/retweet?tweet_id=2049202644879565155"
    );
    expect(screen.getByLabelText("Bookmarks")).toHaveTextContent("1");
    expect(screen.getByText("94.6K")).toBeInTheDocument();
    expect(screen.getByText("3.9K")).toBeInTheDocument();
    expect(screen.getByText("137 Views")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Read 3,951 replies" })
    ).not.toBeInTheDocument();
  });

  it("renders playable video media when available", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2057727911914844378",
      url: "https://x.com/elonmusk/status/2057727911914844378",
      authorName: "Elon Musk",
      authorHandle: "elonmusk",
      text: "Humans using Mythos as seen by Mythos",
      mediaImageUrl: "https://pbs.twimg.com/tweet_video_thumb/example.jpg",
      mediaVideoUrl: "https://video.twimg.com/tweet_video/1080x1350.mp4",
      mediaVideoHlsUrl: "https://video.twimg.com/tweet_video/playlist.m3u8",
      mediaCaptionsUrl: "https://video.twimg.com/tweet_video/captions.vtt",
      mediaPosterUrl: "https://pbs.twimg.com/tweet_video_thumb/example.jpg",
      mediaVideoVariants: [
        {
          url: "https://video.twimg.com/tweet_video/2160x2700.mp4",
          width: 2160,
          height: 2700,
          quality: 2160,
          bitrate: 25000000,
        },
        {
          url: "https://video.twimg.com/tweet_video/1080x1350.mp4",
          width: 1080,
          height: 1350,
          quality: 1080,
          bitrate: 10368000,
        },
        {
          url: "https://video.twimg.com/tweet_video/720x900.mp4",
          width: 720,
          height: 900,
          quality: 720,
          bitrate: 2176000,
        },
      ],
    });

    const { container } = render(
      <TwitterPreviewCard
        href="https://x.com/elonmusk/status/2057727911914844378"
        tweetId="2057727911914844378"
      />
    );

    await screen.findByTestId("twitter-post-preview");
    const video = container.querySelector("video");

    await waitFor(() =>
      expect(video).toHaveAttribute(
        "src",
        "https://video.twimg.com/tweet_video/1080x1350.mp4"
      )
    );
    expect(video).toHaveAttribute(
      "poster",
      "https://pbs.twimg.com/tweet_video_thumb/example.jpg"
    );
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("autoplay");
    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();
    expect(container.querySelector("track")).toHaveAttribute(
      "kind",
      "captions"
    );
    expect(container.querySelector("track")).toHaveAttribute(
      "label",
      "Captions"
    );
    expect(container.querySelector("track")).toHaveAttribute("srclang", "und");
    expect(container.querySelector("track")).not.toHaveAttribute("default");

    expect(screen.queryByText("1080p")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Video quality" })
    );
    expect(
      screen.getByRole("dialog", { name: "Video quality" })
    ).toBeInTheDocument();
    expect(screen.getByText("Video quality")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "1080p" })).toHaveAttribute(
        "aria-checked",
        "true"
      )
    );
    expect(screen.getByRole("radio", { name: /Auto/ })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(screen.queryByText("(1080p)")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "2160p" })).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Close video quality menu" })
    );
    expect(
      screen.queryByRole("dialog", { name: "Video quality" })
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Video quality" })
    );
    expect(
      screen.getByRole("dialog", { name: "Video quality" })
    ).toBeInTheDocument();
    if (!video) {
      throw new Error("Expected video element to render");
    }
    await userEvent.click(video);
    expect(
      screen.queryByRole("dialog", { name: "Video quality" })
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Video quality" })
    );
    if (video) {
      Object.defineProperty(video, "currentTime", {
        configurable: true,
        writable: true,
        value: 12,
      });
      Object.defineProperty(video, "duration", {
        configurable: true,
        value: 30,
      });
      Object.defineProperty(video, "readyState", {
        configurable: true,
        value: HTMLMediaElement.HAVE_METADATA,
      });
    }
    await userEvent.click(screen.getByRole("radio", { name: "720p" }));
    await waitFor(() =>
      expect(container.querySelector("video")).toHaveAttribute(
        "src",
        "https://video.twimg.com/tweet_video/720x900.mp4"
      )
    );
    expect(container.querySelector("video")?.currentTime).toBe(12);
  });

  it("does not render a duplicate manual quality option for HLS-only video", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2057727911914844378",
      url: "https://x.com/elonmusk/status/2057727911914844378",
      authorName: "Elon Musk",
      authorHandle: "elonmusk",
      text: "HLS only",
      mediaVideoUrl: "https://video.twimg.com/tweet_video/playlist.m3u8",
      mediaVideoHlsUrl: "https://video.twimg.com/tweet_video/playlist.m3u8",
    });

    render(
      <TwitterPreviewCard
        href="https://x.com/elonmusk/status/2057727911914844378"
        tweetId="2057727911914844378"
      />
    );

    await screen.findByTestId("twitter-post-preview");

    expect(
      screen.queryByRole("button", { name: "Video quality" })
    ).not.toBeInTheDocument();
  });

  it("labels a single manual video variant when HLS is also available", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2057727911914844378",
      url: "https://x.com/elonmusk/status/2057727911914844378",
      authorName: "Elon Musk",
      authorHandle: "elonmusk",
      text: "Single MP4",
      mediaVideoUrl: "https://video.twimg.com/tweet_video/720x900.mp4",
      mediaVideoHlsUrl: "https://video.twimg.com/tweet_video/playlist.m3u8",
      mediaVideoVariants: [
        {
          url: "https://video.twimg.com/tweet_video/720x900.mp4",
          width: 720,
          height: 900,
          quality: 720,
          bitrate: 2176000,
        },
      ],
    });

    render(
      <TwitterPreviewCard
        href="https://x.com/elonmusk/status/2057727911914844378"
        tweetId="2057727911914844378"
      />
    );

    await screen.findByTestId("twitter-post-preview");
    await userEvent.click(
      screen.getByRole("button", { name: "Video quality" })
    );

    expect(screen.getByRole("radio", { name: "720p" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Option 1" })).toBeNull();
  });

  it("renders the tweet preview card as a native link", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2049202644879565155",
      url: "https://x.com/Mayudropsphotos/status/2049202644879565155",
      authorName: "Mayudrops",
      authorHandle: "Mayudropsphotos",
      text: "Post text",
    });

    render(
      <TwitterPreviewCard
        href="https://x.com/Mayudropsphotos/status/2049202644879565155"
        tweetId="2049202644879565155"
      />
    );

    await screen.findByTestId("twitter-post-preview");
    expect(
      screen.getByRole("link", { name: "Open tweet on X" })
    ).toHaveAttribute(
      "href",
      "https://x.com/Mayudropsphotos/status/2049202644879565155"
    );
  });

  it("renders multiple media items in a gallery grid", async () => {
    const playMock = jest.mocked(HTMLMediaElement.prototype.play);
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2058813617554723314",
      url: "https://x.com/Casa_NUA/status/2058813617554723314",
      authorName: "CasaNUA.6529",
      authorHandle: "Casa_NUA",
      text: "Gallery tweet",
      media: [
        {
          type: "image",
          imageUrl: "https://pbs.twimg.com/media/photo-one.jpg",
        },
        {
          type: "video",
          videoUrl: "https://video.twimg.com/ext_tw_video/video-one.mp4",
          videoHlsUrl: "https://video.twimg.com/ext_tw_video/video-one.m3u8",
          posterUrl: "https://pbs.twimg.com/media/video-poster.jpg",
          videoVariants: [
            {
              url: "https://video.twimg.com/ext_tw_video/video-one-1080.mp4",
              quality: 1080,
            },
            {
              url: "https://video.twimg.com/ext_tw_video/video-one.mp4",
              quality: 720,
            },
          ],
        },
        {
          type: "image",
          imageUrl: "https://pbs.twimg.com/media/photo-two.jpg",
        },
      ],
    });

    const { container } = render(
      <TwitterPreviewCard
        href="https://x.com/Casa_NUA/status/2058813617554723314"
        tweetId="2058813617554723314"
      />
    );

    await screen.findByTestId("twitter-post-preview");

    expect(screen.getAllByRole("img", { name: "Gallery tweet" })).toHaveLength(
      2
    );
    await userEvent.click(screen.getByRole("button", { name: "Tweet video" }));
    const video = container.querySelector("video");
    expect(video).toHaveAttribute(
      "src",
      "https://video.twimg.com/ext_tw_video/video-one.mp4"
    );
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveProperty("muted", true);
    expect(playMock).toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Video quality" })
    ).not.toBeInTheDocument();
  });

  it("renders reply context and clickable mention links", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2058813617554723314",
      url: "https://x.com/Casa_NUA/status/2058813617554723314",
      authorName: "CasaNUA.6529",
      authorHandle: "Casa_NUA",
      replyToHandle: "Casa_NUA",
      text: "5/ 6529 Seizing is a close-up of @punk6529.\n\nHere sharing a display with @Viva_La_Vandal and @BillyNFTees.",
    });

    render(
      <TwitterPreviewCard
        href="https://x.com/Casa_NUA/status/2058813617554723314"
        tweetId="2058813617554723314"
      />
    );

    await screen.findByTestId("twitter-post-preview");

    expect(screen.getByText("Replying to")).toBeInTheDocument();
    const casaLinks = screen.getAllByRole("link", { name: "@Casa_NUA" });
    expect(casaLinks).toHaveLength(2);
    for (const casaLink of casaLinks) {
      expect(casaLink).toHaveAttribute("href", "https://x.com/Casa_NUA");
    }
    expect(screen.getByRole("link", { name: "@punk6529" })).toHaveAttribute(
      "href",
      "https://x.com/punk6529"
    );
    expect(
      screen.getByRole("link", { name: "@Viva_La_Vandal" })
    ).toHaveAttribute("href", "https://x.com/Viva_La_Vandal");
    expect(screen.getByRole("link", { name: "@BillyNFTees" })).toHaveAttribute(
      "href",
      "https://x.com/BillyNFTees"
    );
  });

  it("does not link email or mid-word at signs as Twitter handles", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2058813617554723314",
      url: "https://x.com/Casa_NUA/status/2058813617554723314",
      authorName: "CasaNUA.6529",
      authorHandle: "Casa_NUA",
      text: "Email art@example.com and mid@word are not handles, but @punk6529 is.",
    });

    render(
      <TwitterPreviewCard
        href="https://x.com/Casa_NUA/status/2058813617554723314"
        tweetId="2058813617554723314"
      />
    );

    await screen.findByTestId("twitter-post-preview");

    expect(screen.queryByRole("link", { name: "@example" })).toBeNull();
    expect(screen.queryByRole("link", { name: "@word" })).toBeNull();
    expect(screen.getByRole("link", { name: "@punk6529" })).toHaveAttribute(
      "href",
      "https://x.com/punk6529"
    );
  });

  it("does not show a copy action in the tweet action row", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2049202644879565155",
      url: "https://x.com/Mayudropsphotos/status/2049202644879565155",
      authorName: "Mayudrops",
      authorHandle: "Mayudropsphotos",
      text: "Post text",
    });

    const href = "https://x.com/Mayudropsphotos/status/2049202644879565155";
    render(<TwitterPreviewCard href={href} tweetId="2049202644879565155" />);

    await screen.findByTestId("twitter-post-preview");
    expect(screen.queryByRole("button", { name: /copy/i })).toBeNull();
  });

  it("shows a native fallback card when metadata cannot be fetched", async () => {
    mockedFetchTwitterPreview.mockRejectedValue(new Error("failed"));

    render(
      <TwitterPreviewCard
        href="https://x.com/Mayudropsphotos/status/2057513333985554492"
        tweetId="2057513333985554492"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("twitter-post-fallback")).toBeInTheDocument();
    });
    expect(screen.getByText("Tweet preview unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "https://x.com/Mayudropsphotos/status/2057513333985554492"
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open on X" })).toHaveAttribute(
      "href",
      "https://x.com/Mayudropsphotos/status/2057513333985554492"
    );
    expect(screen.getByRole("button", { name: /copy/i })).toHaveTextContent(
      "Copy"
    );
    expect(
      screen.queryByRole("link", { name: /like/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /reply/i })
    ).not.toBeInTheDocument();
  });
});
