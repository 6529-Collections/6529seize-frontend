import { render, screen } from "@testing-library/react";
import DropPartMarkdown from "../../../../../components/drops/view/part/DropPartMarkdown";

jest.mock("../../../../../hooks/isMobileScreen", () => () => false);
jest.mock("../../../../../contexts/EmojiContext", () => ({
  useEmoji: () => ({ emojiMap: [] }),
}));
jest.mock("react-tweet", () => ({
  Tweet: ({ id }: any) => <div>tweet:{id}</div>,
}));

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

  it.each([
    [
      "standard status link with query params",
      "https://twitter.com/test/status/1234567890?s=20&t=abc",
      "1234567890",
    ],
    [
      "i/web status link",
      "https://twitter.com/i/web/status/9876543210",
      "9876543210",
    ],
    [
      "mobile subdomain link",
      "https://mobile.twitter.com/test/status/1122334455",
      "1122334455",
    ],
  ])("renders tweet embeds for %s", (_, url, expectedId) => {
    const content = `[tweet](${url})`;
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByText(`tweet:${expectedId}`)).toBeInTheDocument();
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
});
