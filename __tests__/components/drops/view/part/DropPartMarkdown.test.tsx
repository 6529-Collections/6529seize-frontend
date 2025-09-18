import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DropPartMarkdown from "../../../../../components/drops/view/part/DropPartMarkdown";
import {
  fetchYoutubePreview,
  type YoutubeOEmbedResponse,
} from "@/services/api/youtube";

const FALLBACK_BASE_ENDPOINT = "https://6529.io";
const originalBaseEndpoint = process.env.BASE_ENDPOINT;
const originalAbFeature = process.env.VITE_FEATURE_AB_CARD;
const originalAbFeatureNext = process.env.NEXT_PUBLIC_FEATURE_AB_CARD;
const originalAbFeatureNextVite = process.env.NEXT_PUBLIC_VITE_FEATURE_AB_CARD;
const originalAbFeatureGeneric = process.env.FEATURE_AB_CARD;

jest.mock("../../../../../hooks/isMobileScreen", () => () => false);
jest.mock("../../../../../contexts/EmojiContext", () => ({
  useEmoji: () => ({ emojiMap: [] }),
}));

const tweetMock = jest.fn(
  ({ id, components, onError }: any) => {
    if (id === "1111111111") {
      throw new Error("boom");
    }

    if (id === "2222222222") {
      const error = new Error("not found");
      onError?.(error);
      const NotFound = components?.TweetNotFound;
      return NotFound ? <NotFound error={error} /> : null;
    }

    return <div>tweet:{id}</div>;
  }
);

jest.mock("react-tweet", () => ({
  Tweet: (props: any) => tweetMock(props),
}));
jest.mock("@/services/api/youtube", () => ({
  fetchYoutubePreview: jest.fn(),
}));

const mockFetchYoutubePreview =
  fetchYoutubePreview as jest.MockedFunction<typeof fetchYoutubePreview>;

const mockLinkPreviewCard = jest.fn(({ renderFallback, href }: any) => (
  <div data-testid="link-preview" data-href={href}>
    {renderFallback()}
  </div>
));

const mockArtBlocksTokenCard = jest.fn((props: any) => (
  <div data-testid="artblocks-card" data-href={props.href} data-token={props.id?.tokenId} />
));

const mockFarcasterCard = jest.fn(({ renderFallback, href }: any) => (
  <span data-testid="farcaster-card" data-href={href}>
    {renderFallback()}
  </span>
));


jest.mock("../../../../../components/waves/LinkPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockLinkPreviewCard(props),
}));

jest.mock("@/src/components/waves/ArtBlocksTokenCard", () => ({
  __esModule: true,
  default: (props: any) => mockArtBlocksTokenCard(props),
}));

jest.mock("../../../../../components/waves/FarcasterCard", () => ({
  __esModule: true,
  default: (props: any) => mockFarcasterCard(props),
}));

beforeEach(() => {
  mockLinkPreviewCard.mockClear();
  mockArtBlocksTokenCard.mockClear();
  mockFarcasterCard.mockClear();
});

afterEach(() => {
  tweetMock.mockClear();
});

describe("DropPartMarkdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (originalBaseEndpoint === undefined) {
      process.env.BASE_ENDPOINT = FALLBACK_BASE_ENDPOINT;
    } else {
      process.env.BASE_ENDPOINT = originalBaseEndpoint;
    }
    if (originalAbFeature === undefined) {
      delete process.env.VITE_FEATURE_AB_CARD;
    } else {
      process.env.VITE_FEATURE_AB_CARD = originalAbFeature;
    }
    if (originalAbFeatureNext === undefined) {
      delete process.env.NEXT_PUBLIC_FEATURE_AB_CARD;
    } else {
      process.env.NEXT_PUBLIC_FEATURE_AB_CARD = originalAbFeatureNext;
    }
    if (originalAbFeatureNextVite === undefined) {
      delete process.env.NEXT_PUBLIC_VITE_FEATURE_AB_CARD;
    } else {
      process.env.NEXT_PUBLIC_VITE_FEATURE_AB_CARD = originalAbFeatureNextVite;
    }
    if (originalAbFeatureGeneric === undefined) {
      delete process.env.FEATURE_AB_CARD;
    } else {
      process.env.FEATURE_AB_CARD = originalAbFeatureGeneric;
    }
  });

  afterEach(() => {
    if (originalBaseEndpoint === undefined) {
      delete process.env.BASE_ENDPOINT;
    } else {
      process.env.BASE_ENDPOINT = originalBaseEndpoint;
    }
    if (originalAbFeature === undefined) {
      delete process.env.VITE_FEATURE_AB_CARD;
    } else {
      process.env.VITE_FEATURE_AB_CARD = originalAbFeature;
    }
    if (originalAbFeatureNext === undefined) {
      delete process.env.NEXT_PUBLIC_FEATURE_AB_CARD;
    } else {
      process.env.NEXT_PUBLIC_FEATURE_AB_CARD = originalAbFeatureNext;
    }
    if (originalAbFeatureNextVite === undefined) {
      delete process.env.NEXT_PUBLIC_VITE_FEATURE_AB_CARD;
    } else {
      process.env.NEXT_PUBLIC_VITE_FEATURE_AB_CARD = originalAbFeatureNextVite;
    }
    if (originalAbFeatureGeneric === undefined) {
      delete process.env.FEATURE_AB_CARD;
    } else {
      process.env.FEATURE_AB_CARD = originalAbFeatureGeneric;
    }
  });

  it("renders gif embeds", () => {
    const content = "Check this ![gif](https://media.tenor.com/test.gif)";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://media.tenor.com/test.gif"
    );
  });

  it("handles external links", () => {
    process.env.BASE_ENDPOINT = "https://example.com";
    const content = "[link](https://google.com)";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    expect(mockFarcasterCard).toHaveBeenCalledTimes(1);
    expect(mockLinkPreviewCard).toHaveBeenCalledTimes(1);
    const previewCall = mockLinkPreviewCard.mock.calls[0][0];
    expect(previewCall.href).toBe("https://google.com");

    const a = screen.getByRole("link", { name: "link" });
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("renders Art Blocks token card when feature enabled", async () => {
    process.env.VITE_FEATURE_AB_CARD = "true";
    const content = "[token](https://www.artblocks.io/token/662000)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => expect(mockArtBlocksTokenCard).toHaveBeenCalledTimes(1));
    const call = mockArtBlocksTokenCard.mock.calls[0][0];
    expect(call.href).toBe("https://www.artblocks.io/token/662000");
    expect(call.id).toEqual({ tokenId: "662000" });
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
  });

  it("falls back to regular link when Art Blocks card disabled", () => {
    process.env.VITE_FEATURE_AB_CARD = "false";
    const content = "[token](https://www.artblocks.io/token/662000)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mockArtBlocksTokenCard).not.toHaveBeenCalled();
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    const link = screen.getByRole("link", { name: "token" });
    expect(link).toHaveAttribute("href", "https://www.artblocks.io/token/662000");
  });

  it("renders a fallback link when tweet data is unavailable", async () => {
    const content =
      "[tweet](https://twitter.com/someuser/status/2222222222)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    const fallbackLink = await screen.findByRole("link", {
      name: /tweet unavailable/i,
    });

    expect(fallbackLink).toHaveAttribute(
      "href",
      "https://twitter.com/someuser/status/2222222222"
    );
    expect(fallbackLink).toHaveAttribute("target", "_blank");
    expect(fallbackLink).toHaveTextContent(/Tweet unavailable/i);
    expect(fallbackLink).toHaveTextContent(/Open on X/i);
  });

  it("renders a fallback link when the tweet embed throws", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const content = "[tweet](https://twitter.com/foo/status/1111111111)";

      render(
        <DropPartMarkdown
          mentionedUsers={[]}
          referencedNfts={[]}
          partContent={content}
          onQuoteClick={jest.fn()}
        />
      );

      const fallbackLink = await screen.findByRole("link", {
        name: /tweet unavailable/i,
      });

      expect(fallbackLink).toHaveAttribute(
        "href",
        "https://twitter.com/foo/status/1111111111"
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("renders YouTube previews with thumbnail and iframe interaction", async () => {
    const preview: YoutubeOEmbedResponse = {
      title: "Sample Video",
      author_name: "Sample Creator",
      thumbnail_url: "https://img.youtube.com/vi/sample/hqdefault.jpg",
      html: '<iframe title="Sample Video" src="https://www.youtube.com/embed/sample"></iframe>',
    };
    mockFetchYoutubePreview.mockResolvedValue(preview);

    const content = "Watch this https://youtu.be/sample";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    const previewButton = await screen.findByRole("button", {
      name: /sample video/i,
    });
    expect(
      await screen.findByRole("img", { name: /sample video/i })
    ).toHaveAttribute("src", preview.thumbnail_url);

    await userEvent.click(previewButton);

    expect(await screen.findByTitle("Sample Video")).toBeInTheDocument();
    expect(mockFetchYoutubePreview).toHaveBeenCalled();
    expect(mockFetchYoutubePreview.mock.calls[0]?.[0]).toBe(
      "https://www.youtube.com/watch?v=sample"
    );
  });

  it("normalizes YouTube URLs before fetching preview data", async () => {
    const preview: YoutubeOEmbedResponse = {
      title: "Normalized Video",
      author_name: "Channel",
      thumbnail_url: "https://img.youtube.com/vi/abc123XYZ/hqdefault.jpg",
      html: '<iframe title="Normalized Video" src="https://www.youtube.com/embed/abc123XYZ"></iframe>',
    };
    mockFetchYoutubePreview.mockResolvedValue(preview);

    const url =
      "https://music.youtube.com/watch?v=abc123XYZ&t=42&list=PL123456";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={`Watch ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => expect(mockFetchYoutubePreview).toHaveBeenCalled());
    expect(mockFetchYoutubePreview.mock.calls[0]?.[0]).toBe(
      "https://www.youtube.com/watch?v=abc123XYZ&list=PL123456"
    );

    const previewButton = await screen.findByRole("button", {
      name: /normalized video/i,
    });
    await userEvent.click(previewButton);
    expect(await screen.findByTitle("Normalized Video")).toBeInTheDocument();
  });

  it("supports additional YouTube path variants", async () => {
    const preview: YoutubeOEmbedResponse = {
      title: "Live Video",
      author_name: "Channel",
      thumbnail_url: "https://img.youtube.com/vi/liveid123/hqdefault.jpg",
      html: '<iframe title="Live Video" src="https://www.youtube.com/embed/liveid123"></iframe>',
    };
    mockFetchYoutubePreview.mockResolvedValue(preview);

    const url = "https://www.youtube.com/live/liveid123?si=token";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={`Watch ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => expect(mockFetchYoutubePreview).toHaveBeenCalled());
    expect(mockFetchYoutubePreview.mock.calls[0]?.[0]).toBe(
      "https://www.youtube.com/watch?v=liveid123"
    );
  });

  it("falls back with original URL for nocookie embeds when fetching fails", async () => {
    mockFetchYoutubePreview.mockRejectedValue(new Error("blocked"));

    const url =
      "https://www.youtube-nocookie.com/embed/abcdef12345?rel=0&start=30";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={`Check ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    const fallbackLink = await screen.findByRole("link", { name: url });
    expect(fallbackLink).toHaveAttribute("href", url);
  });

  it("falls back to a link when YouTube preview rejects", async () => {
    mockFetchYoutubePreview.mockRejectedValue(new Error("network"));

    const url = "https://youtu.be/failure";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={`Check ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    const fallbackLink = await screen.findByRole("link", { name: url });
    expect(fallbackLink).toHaveAttribute("href", url);
  });

  it("falls back to a link when YouTube preview returns null", async () => {
    mockFetchYoutubePreview.mockResolvedValue(null);

    const url = "https://youtu.be/unknown";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={`Check ${url}`}
        onQuoteClick={jest.fn()}
      />
    );

    const fallbackLink = await screen.findByRole("link", { name: url });
    expect(fallbackLink).toHaveAttribute("href", url);
  });
});
