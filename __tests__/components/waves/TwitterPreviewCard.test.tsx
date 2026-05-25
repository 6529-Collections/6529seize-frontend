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
    expect(screen.getByRole("link", { name: /94,626/i })).toHaveAttribute(
      "href",
      "https://x.com/intent/like?tweet_id=2049202644879565155"
    );
    expect(screen.getByRole("link", { name: /reply/i })).toHaveAttribute(
      "href",
      "https://x.com/intent/tweet?in_reply_to=2049202644879565155"
    );
    expect(
      screen.getByRole("link", { name: "Read 3,951 replies" })
    ).toHaveAttribute(
      "href",
      "https://x.com/Mayudropsphotos/status/2049202644879565155"
    );
  });

  it("renders playable video media when available", async () => {
    mockedFetchTwitterPreview.mockResolvedValue({
      tweetId: "2057727911914844378",
      url: "https://x.com/elonmusk/status/2057727911914844378",
      authorName: "Elon Musk",
      authorHandle: "elonmusk",
      text: "Humans using Mythos as seen by Mythos",
      mediaImageUrl: "https://pbs.twimg.com/tweet_video_thumb/example.jpg",
      mediaVideoUrl: "https://video.twimg.com/tweet_video/example.mp4",
      mediaPosterUrl: "https://pbs.twimg.com/tweet_video_thumb/example.jpg",
    });

    const { container } = render(
      <TwitterPreviewCard
        href="https://x.com/elonmusk/status/2057727911914844378"
        tweetId="2057727911914844378"
      />
    );

    await screen.findByTestId("twitter-post-preview");
    const video = container.querySelector("video");

    expect(video).toHaveAttribute(
      "src",
      "https://video.twimg.com/tweet_video/example.mp4"
    );
    expect(video).toHaveAttribute(
      "poster",
      "https://pbs.twimg.com/tweet_video_thumb/example.jpg"
    );
    expect(video).toHaveAttribute("controls");
    expect(container.querySelector("track")).toHaveAttribute(
      "kind",
      "captions"
    );
  });

  it("copies the original Twitter/X post link", async () => {
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
    await userEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(href);
    expect(screen.getByRole("button", { name: /copy/i })).toHaveTextContent(
      "Copied"
    );
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
    expect(
      screen.queryByRole("link", { name: /like/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /reply/i })
    ).not.toBeInTheDocument();
  });
});
