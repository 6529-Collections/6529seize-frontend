import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";

import { createLinkRenderer } from "@/components/drops/view/part/dropPartMarkdown/linkHandlers";
import { publicEnv } from "@/config/env";

jest.mock("@/components/drops/view/part/dropPartMarkdown/youtubePreview", () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => (
    <div data-testid="youtube-preview" data-href={href} />
  ),
}));

jest.mock("@/components/drops/view/part/DropPartMarkdownImage", () => ({
  __esModule: true,
  default: ({ src }: { src: string }) => <img data-testid="markdown-image" src={src} alt="" />,
}));

jest.mock("@/components/drops/view/part/dropPartMarkdown/renderers", () => ({
  renderGifEmbed: jest.fn((url: string) => <div data-testid="gif" data-url={url} />),
  renderSeizeQuote: jest.fn(() => <div data-testid="seize-quote" />),
  renderTweetEmbed: jest.fn((href: string) => (
    <div data-testid="tweet" data-href={href} />
  )),
  TweetFallback: () => null,
}));

jest.mock("@/src/components/waves/ArtBlocksTokenCard", () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => (
    <div data-testid="artblocks-card" data-href={href} />
  ),
}));

jest.mock("@/components/waves/pepe/PepeCard", () => ({
  __esModule: true,
  default: ({ href, kind }: { href: string; kind: string }) => (
    <div data-testid="pepe-card" data-kind={kind} data-href={href} />
  ),
}));

jest.mock("@/components/drops/view/part/dropPartMarkdown/tiktok", () => ({
  parseTikTokLink: jest.requireActual("@/components/drops/view/part/dropPartMarkdown/tiktok").parseTikTokLink,
}));

jest.mock("@/components/waves/TikTokCard", () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => (
    <div data-testid="tiktok-card" data-href={href} />
  ),
}));

jest.mock("@/components/waves/LinkPreviewCard", () => ({
  __esModule: true,
  default: ({ href, renderFallback }: { href: string; renderFallback: () => ReactNode }) => (
    <div data-testid="opengraph" data-href={href}>
      {renderFallback()}
    </div>
  ),
}));

const mockEnsLinkPreview = jest.fn(({ href }: { href: string }) => (
  <div data-testid="ens-link-preview" data-href={href} />
));

jest.mock("@/components/waves/ens/EnsLinkPreview", () => ({
  __esModule: true,
  default: (props: any) => mockEnsLinkPreview(props),
}));

jest.mock("@/components/waves/FarcasterCard", () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => (
    <div data-testid="farcaster-card" data-href={href} />
  ),
}));

jest.mock("@/components/waves/WikimediaCard", () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => <div data-testid="wikimedia-card" data-href={href} />,
}));

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => <div data-testid="chat-buttons" data-href={href} />,
}));

jest.mock("@/components/groups/page/list/card/GroupCardChat", () => ({
  __esModule: true,
  default: ({ groupId }: { groupId: string }) => (
    <div data-testid="group-card" data-group={groupId} />
  ),
}));

jest.mock("@/components/waves/list/WaveItemChat", () => ({
  __esModule: true,
  default: ({ waveId }: { waveId: string }) => <div data-testid="wave-card" data-wave={waveId} />,
}));

jest.mock("@/components/waves/drops/DropItemChat", () => ({
  __esModule: true,
  default: ({ dropId }: { dropId: string }) => <div data-testid="drop-card" data-drop={dropId} />,
}));

const onQuoteClick = jest.fn();

const baseRenderer = () => createLinkRenderer({ onQuoteClick });

describe("createLinkRenderer", () => {
  const FALLBACK_BASE_ENDPOINT = "https://6529.io";
  const originalBaseEndpointEnv = publicEnv.BASE_ENDPOINT;
  const originalProcessBaseEndpoint = process.env.BASE_ENDPOINT;

  beforeEach(() => {
    jest.clearAllMocks();
    publicEnv.BASE_ENDPOINT = FALLBACK_BASE_ENDPOINT;
    process.env.BASE_ENDPOINT = FALLBACK_BASE_ENDPOINT;
  });

  afterEach(() => {
    publicEnv.BASE_ENDPOINT = originalBaseEndpointEnv;
    if (originalProcessBaseEndpoint === undefined) {
      delete process.env.BASE_ENDPOINT;
    } else {
      process.env.BASE_ENDPOINT = originalProcessBaseEndpoint;
    }
  });

  it("renders DropPartMarkdownImage for img elements", () => {
    const { renderImage } = baseRenderer();
    const element = renderImage({ src: "https://example.com/image.png" });
    expect(element).not.toBeNull();
    const { getByTestId } = render(<>{element}</>);
    expect(getByTestId("markdown-image")).toHaveAttribute("src", "https://example.com/image.png");
  });

  it("returns null for invalid image sources", () => {
    const { renderImage } = baseRenderer();
    expect(renderImage({ src: undefined })).toBeNull();
  });

  it("uses TikTok handler for supported URLs", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://www.tiktok.com/@creator/video/123456" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("tiktok-card")).toHaveAttribute("data-href", "https://www.tiktok.com/@creator/video/123456");
    expect(screen.queryByTestId("opengraph")).not.toBeInTheDocument();
  });

  it("uses YouTube handler for supported URLs", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://youtu.be/video123" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("youtube-preview")).toHaveAttribute(
      "data-href",
      "https://youtu.be/video123"
    );
    expect(screen.queryByTestId("opengraph")).not.toBeInTheDocument();
  });

  it("renders seize quote previews when matching internal links", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({
      href: "https://6529.io/my-stream?wave=123e4567-e89b-12d3-a456-426614174000&serialNo=5",
    } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("seize-quote")).toBeInTheDocument();
  });

  it("renders seize group previews", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://6529.io/network?group=test-group" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("group-card")).toHaveAttribute("data-group", "test-group");
  });

  it("renders seize drop previews", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://6529.io/my-stream?wave=abc&drop=def" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("drop-card")).toHaveAttribute("data-drop", "def");
  });

  it.each([
    ["standard status link", "https://twitter.com/user/status/987654321"],
    ["mobile twitter link", "https://mobile.twitter.com/user/status/987654321"],
    ["i/web link", "https://twitter.com/i/web/status/987654321"],
    ["x.com link", "https://x.com/user/status/987654321"],
    ["hashbang link", "https://twitter.com/#!/user/status/987654321"],
  ])("renders Twitter embeds for %s", (_, tweetHref) => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: tweetHref } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("tweet")).toHaveAttribute("data-href", tweetHref);
    expect(screen.queryByTestId("opengraph")).not.toBeInTheDocument();
  });

  it("renders Wikimedia cards", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://en.wikipedia.org/wiki/Test" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("wikimedia-card")).toHaveAttribute("data-href", "https://en.wikipedia.org/wiki/Test");
  });

  it("renders gif embeds", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({
      href: "https://media.tenor.com/test.gif",
    } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("gif")).toHaveAttribute("data-url", "https://media.tenor.com/test.gif");
  });

  it("renders Art Blocks previews", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://www.artblocks.io/token/662000" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("artblocks-card")).toHaveAttribute("data-href", "https://www.artblocks.io/token/662000");
    expect(screen.getByTestId("chat-buttons")).toHaveAttribute("data-href", "https://www.artblocks.io/token/662000");
  });

  it("renders Pepe cards", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://pepe.wtf/asset/test" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("pepe-card")).toHaveAttribute("data-kind", "asset");
  });

  it("renders Farcaster cards", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://warpcast.com/alice/0x123" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("farcaster-card")).toHaveAttribute("data-href", "https://warpcast.com/alice/0x123");
    expect(screen.queryByTestId("opengraph")).toBeNull();
  });

  it("renders ENS previews", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "vitalik.eth" } as any);
    render(<>{element}</>);
    expect(mockEnsLinkPreview).toHaveBeenCalledWith({ href: "vitalik.eth" });
    expect(screen.getByTestId("ens-link-preview")).toHaveAttribute("data-href", "vitalik.eth");
  });

  it("renders Open Graph preview for generic external links", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "https://example.org/post" } as any);
    render(<>{element}</>);
    expect(screen.getByTestId("opengraph")).toHaveAttribute("data-href", "https://example.org/post");
  });

  it("falls back to standard anchor for unsupported protocols", () => {
    const { renderAnchor } = baseRenderer();
    const element = renderAnchor({ href: "ftp://example.org/resource", children: "ftp" } as any);
    render(<>{element}</>);
    expect(screen.getByText("ftp" as any)).toHaveAttribute("href", "ftp://example.org/resource");
  });

  it("identifies block-level smart links", () => {
    const { isSmartLink } = baseRenderer();
    expect(isSmartLink("https://youtu.be/video123")).toBe(true);
    expect(isSmartLink("https://example.org/post"))
      .toBe(true);
    expect(isSmartLink("https://example.org"))
      .toBe(true);
    expect(isSmartLink("ftp://example.org/resource")).toBe(false);
  });

  it("returns null when href is missing", () => {
    const { renderAnchor } = baseRenderer();
    expect(renderAnchor({ children: "missing" } as any)).toBeNull();
  });
});
