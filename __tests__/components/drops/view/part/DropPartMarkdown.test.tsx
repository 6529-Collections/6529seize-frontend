import { render, screen } from "@testing-library/react";
import DropPartMarkdown from "../../../../../components/drops/view/part/DropPartMarkdown";

jest.mock("../../../../../hooks/isMobileScreen", () => () => false);
jest.mock("../../../../../contexts/EmojiContext", () => ({
  useEmoji: () => ({ emojiMap: [] }),
}));

const FALLBACK_BASE_ENDPOINT = "https://6529.io";
const originalBaseEndpoint =
  process.env.BASE_ENDPOINT ?? FALLBACK_BASE_ENDPOINT;

process.env.BASE_ENDPOINT = originalBaseEndpoint;

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

afterEach(() => {
  tweetMock.mockClear();
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
});
