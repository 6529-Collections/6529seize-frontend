import { render, screen, waitFor } from "@testing-library/react";
import DropPartMarkdown from "../../../../../components/drops/view/part/DropPartMarkdown";
import { fetchLinkPreview } from "../../../../../services/api/link-preview";

jest.mock("../../../../../hooks/isMobileScreen", () => () => false);
jest.mock("../../../../../contexts/EmojiContext", () => ({
  useEmoji: () => ({ emojiMap: [] }),
}));
jest.mock("react-tweet", () => ({
  Tweet: ({ id }: any) => <div>tweet:{id}</div>,
}));
jest.mock("../../../../../services/api/link-preview", () => ({
  fetchLinkPreview: jest.fn(),
}));

const mockFetchLinkPreview =
  fetchLinkPreview as jest.MockedFunction<typeof fetchLinkPreview>;

const originalBaseEndpoint = process.env.BASE_ENDPOINT;

beforeEach(() => {
  mockFetchLinkPreview.mockReset();
  process.env.BASE_ENDPOINT = originalBaseEndpoint;
});

describe("DropPartMarkdown", () => {
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

  it("renders link preview metadata for external links", async () => {
    process.env.BASE_ENDPOINT = "https://6529.io";
    mockFetchLinkPreview.mockResolvedValue({
      title: "Example Article",
      description: "An example description.",
      image: "https://example.com/og.png",
      siteName: "Example.com",
      url: "https://example.com/article",
    });

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent="https://example.com/article"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("link-preview-card")).toBeInTheDocument()
    );

    expect(screen.getByText("Example Article")).toBeInTheDocument();
    const previewImage = screen.getByRole("img", {
      name: /example article/i,
    });
    expect(previewImage).toHaveAttribute("src", "https://example.com/og.png");
    expect(
      screen.queryByRole("link", { name: "https://example.com/article" })
    ).not.toBeInTheDocument();
  });

  it("falls back to a standard link when preview fetch fails", async () => {
    process.env.BASE_ENDPOINT = "https://6529.io";
    mockFetchLinkPreview.mockRejectedValue(new Error("network error"));

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent="https://example.com/article"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => expect(mockFetchLinkPreview).toHaveBeenCalled());

    expect(
      screen.getByRole("link", { name: "https://example.com/article" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("link-preview-card")).not.toBeInTheDocument();
  });
});
