import { render, screen } from "@testing-library/react";
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
    const a = screen.getByRole("link");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel");
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
    const a = screen.getByRole("link");
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
      "https://youtu.be/sample"
    );
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
