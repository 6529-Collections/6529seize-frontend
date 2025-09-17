import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DropPartMarkdown from "../../../../../components/drops/view/part/DropPartMarkdown";
import {
  fetchYoutubePreview,
  type YoutubeOEmbedResponse,
} from "@/services/api/youtube";

jest.mock("../../../../../hooks/isMobileScreen", () => () => false);
jest.mock("../../../../../contexts/EmojiContext", () => ({
  useEmoji: () => ({ emojiMap: [] }),
}));
jest.mock("react-tweet", () => ({
  Tweet: ({ id }: any) => <div>tweet:{id}</div>,
}));
jest.mock("@/services/api/youtube", () => ({
  fetchYoutubePreview: jest.fn(),
}));

const mockFetchYoutubePreview =
  fetchYoutubePreview as jest.MockedFunction<typeof fetchYoutubePreview>;
const originalBaseEndpoint = process.env.BASE_ENDPOINT;

const mockLinkPreviewCard = jest.fn(({ renderFallback, href }: any) => (
  <div data-testid="link-preview" data-href={href}>
    {renderFallback()}
  </div>
));

jest.mock("../../../../../components/waves/LinkPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockLinkPreviewCard(props),
}));

beforeEach(() => {
  mockLinkPreviewCard.mockClear();
});

describe("DropPartMarkdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (originalBaseEndpoint === undefined) {
      delete process.env.BASE_ENDPOINT;
    } else {
      process.env.BASE_ENDPOINT = originalBaseEndpoint;
    }
  });

  afterEach(() => {
    if (originalBaseEndpoint === undefined) {
      delete process.env.BASE_ENDPOINT;
    } else {
      process.env.BASE_ENDPOINT = originalBaseEndpoint;
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
    expect(mockLinkPreviewCard).toHaveBeenCalledTimes(1);
    const previewCall = mockLinkPreviewCard.mock.calls[0][0];
    expect(previewCall.href).toBe("https://google.com");

    const a = screen.getByRole("link", { name: "link" });
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("handles internal links", () => {
    process.env.BASE_ENDPOINT = "https://example.com";
    const content = "[home](https://example.com/page)";
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    expect(mockLinkPreviewCard).not.toHaveBeenCalled();
    const a = screen.getByRole("link", { name: "home" });
    expect(a).not.toHaveAttribute("target");
    expect(a).toHaveAttribute("href", "/page");
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
