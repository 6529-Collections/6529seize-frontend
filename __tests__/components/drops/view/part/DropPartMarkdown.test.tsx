import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

type DropPartMarkdownType = typeof import("../../../../../components/drops/view/part/DropPartMarkdown").default;

describe("DropPartMarkdown", () => {
  let DropPartMarkdown: DropPartMarkdownType;
  let dynamicSpy: jest.Mock;

  const loadComponent = async (): Promise<void> => {
    jest.resetModules();
    dynamicSpy = jest.fn();

    jest.doMock("../../../../../hooks/isMobileScreen", () => () => false);
    jest.doMock("../../../../../contexts/EmojiContext", () => ({
      useEmoji: () => ({
        emojiMap: [],
        findNativeEmoji: () => undefined,
      }),
    }));
    jest.doMock("react-tweet", () => ({
      Tweet: ({ id }: any) => <div>tweet:{id}</div>,
    }));
    jest.doMock("next/dynamic", () => ({
      __esModule: true,
      default: (loader: any, options: any) => {
        dynamicSpy(loader, options);
        const LoadingComponent = options?.loading;
        const DynamicComponent = (props: any): ReactElement | null =>
          LoadingComponent ? <LoadingComponent {...props} /> : null;

        (DynamicComponent as any).__loader = loader;
        (DynamicComponent as any).__options = options;

        return DynamicComponent;
      },
    }));

    DropPartMarkdown = (
      await import("../../../../../components/drops/view/part/DropPartMarkdown")
    ).default;
  };

  beforeEach(async () => {
    await loadComponent();
  });

  afterEach(() => {
    jest.resetModules();
    delete process.env.BASE_ENDPOINT;
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

  it("lazy loads tweet embeds with a loading skeleton", async () => {
    const content = "Check this [tweet](https://twitter.com/user/status/1234567890)";

    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("tweet-embed-loading")).toBeInTheDocument();

    expect(dynamicSpy).toHaveBeenCalledTimes(1);
    const [loader, options] = dynamicSpy.mock.calls[0];
    expect(options?.ssr).toBe(false);

    const TweetComponent = await loader();
    const { getByText } = render(<TweetComponent id="abc123" />);
    expect(getByText("tweet:abc123")).toBeInTheDocument();
  });
});
