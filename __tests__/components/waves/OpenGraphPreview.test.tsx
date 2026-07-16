import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import OpenGraphPreview from "@/components/waves/OpenGraphPreview";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a
      href={typeof href === "string" ? href : (href?.pathname ?? "")}
      {...rest}
    >
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockNextImage({
    alt = "",
    unoptimized: _unoptimized,
    fill: _fill,
    ...rest
  }: any) {
    return React.createElement("img", { alt, ...rest });
  },
}));

jest.mock("@/helpers/Helpers", () => ({
  removeBaseEndpoint: jest.fn((url: string) =>
    url.replace("https://example.com", "")
  ),
}));

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: function MockChatItemHrefButtons(props: any) {
    return (
      <div data-testid="href-buttons">{props.relativeHref ?? "undefined"}</div>
    );
  },
}));

const { removeBaseEndpoint } = require("@/helpers/Helpers");

describe("OpenGraphPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton when preview is undefined", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/article");

    render(<OpenGraphPreview href="https://example.com/article" />);

    const skeleton = screen.getByTestId("og-preview-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.parentElement).toHaveClass("tw-h-full");
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/article");
    expect(removeBaseEndpoint).toHaveBeenCalledWith(
      "https://example.com/article"
    );
  });

  it("hides action buttons when hideActions is true", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/article");

    render(
      <OpenGraphPreview
        href="https://example.com/article"
        preview={undefined}
        hideActions={true}
      />
    );

    expect(screen.getByTestId("og-preview-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("href-buttons")).toBeNull();
  });

  it("renders fallback when preview is unavailable", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/article");

    render(
      <OpenGraphPreview href="https://example.com/article" preview={null} />
    );

    const unavailable = screen.getByTestId("og-preview-unavailable");
    expect(unavailable).toBeInTheDocument();
    expect(unavailable).toHaveClass("tw-h-full");
    const link = screen.getByRole("link", { name: "example.com" });
    expect(link).toHaveAttribute("href", "/article");
    expect(link).not.toHaveAttribute("target");
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/article");
  });

  it("renders preview details when data is provided", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/article");

    render(
      <OpenGraphPreview
        href="https://example.com/article"
        preview={{
          title: "Example Title",
          description: "An example description",
          siteName: "Example.com",
          image: {
            url: "https://cdn.example.com/preview.png",
            alt: "Example article hero",
          },
        }}
      />
    );

    const card = screen.getByTestId("og-preview-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("tw-h-full");
    expect(card).toHaveClass(
      "tw-grid-cols-[6rem,minmax(0,1fr)]",
      "sm:tw-grid-cols-[8rem,minmax(0,1fr)]",
      "md:tw-grid-cols-[10.5rem,minmax(0,1fr)]"
    );
    expect(screen.getByText("Example.com")).toBeInTheDocument();
    expect(card).toHaveAttribute("href", "/article");
    expect(card).not.toHaveAttribute("target");
    const image = screen.getByAltText("Example article hero");
    expect(image).toHaveAttribute("src", "https://cdn.example.com/preview.png");
    expect(image).toHaveAttribute(
      "sizes",
      "(max-width: 640px) 6rem, (max-width: 768px) 8rem, 10.5rem"
    );
    expect(image.parentElement).toHaveClass(
      "tw-aspect-[16/10]",
      "tw-bg-black/40"
    );
    expect(screen.getByText("An example description")).toBeInTheDocument();
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/article");
  });

  it("renders external file previews without scanned safety claims", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://files.example/Safety%20Plan.pdf"
    );

    render(
      <OpenGraphPreview
        href="https://files.example/Safety%20Plan.pdf"
        preview={{
          type: "external.file",
          title: "Safety Plan.pdf",
          fileName: "Safety Plan.pdf",
          extension: "pdf",
          fileKind: "pdf",
          contentType: "application/pdf",
          sizeBytes: 2048,
          sourceHost: "files.example",
          trust: "external_unscanned",
          links: {
            open: "https://files.example/Safety%20Plan.pdf",
          },
        }}
      />
    );

    const card = screen.getByTestId("external-file-preview-card");
    expect(card).toHaveAttribute(
      "href",
      "https://files.example/Safety%20Plan.pdf"
    );
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Safety Plan.pdf")).toBeInTheDocument();
    expect(screen.getByText("files.example")).toBeInTheDocument();
    expect(screen.getByText("External source")).toBeInTheDocument();
    expect(screen.getByText("MIME")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.getByText("Open source")).toBeInTheDocument();
    expect(screen.queryByText(/scanned/i)).toBeNull();
  });

  it("renders YouTube video previews with click-to-play iframe", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://youtu.be/abc123XYZ_0?t=42"
    );

    render(
      <OpenGraphPreview
        href="https://youtu.be/abc123XYZ_0?t=42"
        preview={{
          type: "youtube.video",
          title: "A Good Video",
          provider: "YouTube",
          videoId: "abc123XYZ_0",
          watchUrl: "https://www.youtube.com/watch?v=abc123XYZ_0&t=42s",
          embedUrl:
            "https://www.youtube-nocookie.com/embed/abc123XYZ_0?rel=0&playsinline=1&start=42",
          thumbnailUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
          authorName: "Channel 6529",
        }}
      />
    );

    expect(
      screen.getByTestId("youtube-video-preview-card")
    ).toBeInTheDocument();
    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getByText("by Channel 6529")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A Good Video" })).toHaveAttribute(
      "href",
      "https://youtu.be/abc123XYZ_0?t=42"
    );
    expect(
      screen.getByRole("link", { name: /watch on youtube/i })
    ).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=abc123XYZ_0&t=42s"
    );
    expect(
      screen.getByRole("img", {
        name: "YouTube thumbnail for A Good Video",
      })
    ).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg"
    );
    expect(screen.queryByTestId("youtube-video-embed")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Play YouTube video: A Good Video",
      })
    );

    const iframe = screen.getByTitle("A Good Video");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123XYZ_0?rel=0&playsinline=1&start=42"
    );
  });

  it("does not render an iframe control for untrusted YouTube embed URLs", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://youtu.be/abc123XYZ_0"
    );

    render(
      <OpenGraphPreview
        href="https://youtu.be/abc123XYZ_0"
        preview={{
          type: "youtube.video",
          title: "A Good Video",
          provider: "YouTube",
          videoId: "abc123XYZ_0",
          watchUrl: "https://www.youtube.com/watch?v=abc123XYZ_0",
          embedUrl: "https://evil.example/embed/abc123XYZ_0",
          thumbnailUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
        }}
      />
    );

    expect(screen.queryByTestId("youtube-video-play")).toBeNull();
    expect(screen.queryByTestId("youtube-video-embed")).toBeNull();
    expect(
      screen.getByRole("link", { name: "YouTube thumbnail for A Good Video" })
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=abc123XYZ_0");
  });

  it("uses localized YouTube fallbacks for sparse server data", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://youtu.be/abc123XYZ_0"
    );

    render(
      <OpenGraphPreview
        href="https://youtu.be/abc123XYZ_0"
        preview={
          {
            type: "youtube.video",
            title: null,
            provider: null,
            videoId: "abc123XYZ_0",
            watchUrl: "https://www.youtube.com/watch?v=abc123XYZ_0",
            embedUrl:
              "https://www.youtube-nocookie.com/embed/abc123XYZ_0?rel=0&playsinline=1",
            thumbnailUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
            author: { name: "not renderable" },
          } as any
        }
      />
    );

    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "YouTube video" })).toHaveAttribute(
      "href",
      "https://youtu.be/abc123XYZ_0"
    );
    expect(
      screen.getByRole("img", { name: "YouTube video thumbnail" })
    ).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg"
    );
    expect(screen.queryByText("by [object Object]")).toBeNull();
  });

  it("renders Farcaster Mini App previews with launch metadata", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://mini.example/app"
    );

    render(
      <OpenGraphPreview
        href="https://mini.example/app"
        preview={{
          type: "farcaster.miniapp",
          embedKind: "miniapp",
          title: "Example Mini",
          appName: "Example Mini",
          description: "Launch the example app",
          siteName: "Example Mini",
          buttonTitle: "Launch",
          actionUrl: "https://mini.example/launch",
          imageUrl: "https://mini.example/preview.png",
          splashImageUrl: "https://mini.example/splash.png",
          splashBackgroundColor: "#855dcd",
        }}
      />
    );

    const card = screen.getByTestId("farcaster-embed-preview-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("tw-overflow-x-hidden", "tw-overflow-y-auto");
    expect(screen.getByTestId("farcaster-embed-preview-content")).toHaveClass(
      "tw-min-h-full"
    );
    expect(screen.getAllByText("Mini App").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Example Mini" })).toHaveAttribute(
      "href",
      "https://mini.example/app"
    );
    expect(screen.getByText("Launch the example app")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Launch" })).toHaveAttribute(
      "href",
      "https://mini.example/launch"
    );
    expect(
      screen.getByRole("img", {
        name: "Farcaster embed preview for Example Mini",
      })
    ).toHaveAttribute("src", "https://mini.example/preview.png");
    expect(screen.getByAltText("")).toHaveAttribute(
      "src",
      "https://mini.example/splash.png"
    );
  });

  it("renders legacy Farcaster frame titles before the site label", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://legacy.example/frame"
    );

    render(
      <OpenGraphPreview
        href="https://legacy.example/frame"
        preview={{
          type: "farcaster.frame",
          embedKind: "legacy-frame",
          title: "Legacy Frame",
          appName: "Legacy Example",
          siteName: "Legacy Example",
          buttonTitle: "View",
          actionUrl: "https://legacy.example/view",
          imageUrl: "https://legacy.example/frame.png",
        }}
      />
    );

    expect(screen.getByRole("link", { name: "Legacy Frame" })).toHaveAttribute(
      "href",
      "https://legacy.example/frame"
    );
    expect(screen.getByText("Legacy Example")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "https://legacy.example/view"
    );
  });

  it("falls Farcaster action links back to the pasted URL for http targets", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://mini.example/app"
    );

    render(
      <OpenGraphPreview
        href="https://mini.example/app"
        preview={{
          type: "farcaster.miniapp",
          embedKind: "miniapp",
          title: "Example Mini",
          appName: "Example Mini",
          siteName: "Example Mini",
          buttonTitle: "Launch",
          actionUrl: "http://mini.example/launch",
          imageUrl: "https://mini.example/preview.png",
        }}
      />
    );

    expect(screen.getByRole("link", { name: "Launch" })).toHaveAttribute(
      "href",
      "https://mini.example/app"
    );
  });

  it("renders sparse article metadata with a source label and no empty fields", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/research/notes");

    render(
      <OpenGraphPreview
        href="https://journal.example/research/notes"
        preview={{
          type: "article",
          title: "Research Notes",
          source: "Example Journal",
          author: "Ada Lovelace",
          publishedTime: "2026-06-16T12:00:00.000Z",
          favicon: "https://journal.example/favicon.ico",
        }}
      />
    );

    const card = screen.getByTestId("og-preview-card");
    expect(card).toBeInTheDocument();
    expect(screen.getByText("Example Journal")).toBeInTheDocument();

    expect(card).toHaveAttribute("href", "/research/notes");
    expect(card).not.toHaveAttribute("target");
    expect(screen.getByText("Research Notes")).toBeInTheDocument();
    expect(screen.getByText("by Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Jun 16, 2026")).toBeInTheDocument();
    expect(screen.queryByText("Link unavailable")).toBeNull();
  });

  it("prefers canonical URL domains over source fallbacks", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://canonical.example/article"
    );

    render(
      <OpenGraphPreview
        href="https://request.example/redirect"
        preview={{
          title: "Canonical Source",
          canonicalUrl: "https://canonical.example/article",
          source: "request.example",
        }}
      />
    );

    expect(screen.getByText("canonical.example")).toBeInTheDocument();
    expect(screen.queryByText("request.example")).toBeNull();
  });

  it("formats supported calendar dates in UTC", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/research/notes");

    render(
      <OpenGraphPreview
        href="https://journal.example/research/notes"
        preview={{
          title: "Late Dispatch",
          source: "Example Journal",
          publishedTime: "2026-06-16T23:30:00-05:00",
        }}
      />
    );

    const date = screen.getByText("Jun 17, 2026");
    expect(date).toHaveAttribute("datetime", "2026-06-17T04:30:00.000Z");
  });

  it("renders timezone-ambiguous timestamps without datetime attributes", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/dispatch");

    render(
      <OpenGraphPreview
        href="https://journal.example/dispatch"
        preview={{
          title: "Field Dispatch",
          source: "Example Journal",
          publishedTime: "2026-06-16 12:00",
        }}
      />
    );

    const date = screen.getByText("2026-06-16 12:00");
    expect(date.tagName).toBe("TIME");
    expect(date).not.toHaveAttribute("datetime");
  });

  it("renders free-text published dates without invalid datetime attributes", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/dispatch");

    render(
      <OpenGraphPreview
        href="https://journal.example/dispatch"
        preview={{
          title: "Field Dispatch",
          source: "Example Journal",
          publishedTime: "Spring 2026",
        }}
      />
    );

    const date = screen.getByText("Spring 2026");
    expect(date.tagName).toBe("TIME");
    expect(date).not.toHaveAttribute("datetime");
  });

  it("renders partially parseable published dates without invalid datetime attributes", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/dispatch");

    render(
      <OpenGraphPreview
        href="https://journal.example/dispatch"
        preview={{
          title: "Field Dispatch",
          source: "Example Journal",
          publishedTime: "Jun 16 2026 after publication",
        }}
      />
    );

    const date = screen.getByText("Jun 16 2026 after publication");
    expect(date.tagName).toBe("TIME");
    expect(date).not.toHaveAttribute("datetime");
  });

  it("does not render generic badges for dotted provider-style types", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/provider");

    render(
      <OpenGraphPreview
        href="https://journal.example/provider"
        preview={{
          title: "Provider Payload",
          source: "Example Journal",
          type: "github.repository",
        }}
      />
    );

    expect(screen.getByText("Provider Payload")).toBeInTheDocument();
    expect(screen.queryByText("Github Repository")).toBeNull();
  });

  it("preserves generated 6529 profile cards instead of cropping them", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/punk6529bot");

    render(
      <OpenGraphPreview
        href="https://6529.io/punk6529bot"
        preview={{
          title: "punk6529bot",
          description: "Identity | 6529.io",
          siteName: "6529.io",
          image: {
            url: "https://6529.io/api/og-metadata/profiles/punk6529bot",
          },
        }}
      />
    );

    const card = screen.getByTestId("og-preview-card");
    expect(card).toHaveAttribute("data-og-kind", "profile");
    expect(screen.getByText("Profile")).toBeInTheDocument();

    const mediaLink = screen.getAllByRole("link", {
      name: "punk6529bot",
    })[0];
    expect(mediaLink).toHaveClass(
      "tw-h-28",
      "lg:tw-h-full",
      "lg:tw-w-72",
      "xl:tw-w-80"
    );

    const image = screen.getByAltText("punk6529bot");
    expect(image).toHaveAttribute(
      "src",
      "https://6529.io/api/og-metadata/profiles/punk6529bot"
    );
    expect(image).toHaveClass("tw-object-contain");
    expect(image).toHaveAttribute(
      "sizes",
      "(max-width: 640px) 100vw, (max-width: 768px) 14rem, (max-width: 1024px) 18rem, 20rem"
    );
  });

  it("handles external links and image arrays", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "https://othersite.com/post"
    );

    render(
      <OpenGraphPreview
        href="https://othersite.com/post"
        preview={{
          images: [{ url: "https://cdn.othersite.com/img.jpg" }],
          description: "External link description",
        }}
      />
    );

    const card = screen.getByTestId("og-preview-card");
    expect(card).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "https://othersite.com/post");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    expect(screen.getByAltText("othersite.com")).toHaveAttribute(
      "src",
      "https://cdn.othersite.com/img.jpg"
    );
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("undefined");
  });

  it("uses secureUrl fields when provided", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/article");

    render(
      <OpenGraphPreview
        href="https://example.com/article"
        preview={{
          title: "Secure Image",
          image: { secureUrl: "https://cdn.example.com/secure.png" },
        }}
      />
    );

    expect(screen.getByAltText("Secure Image")).toHaveAttribute(
      "src",
      "https://cdn.example.com/secure.png"
    );
  });

  it("wraps long unbroken segments to keep layout consistent", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/article");

    const longUrl = `https://example.com/${"a".repeat(48)}`;

    render(
      <OpenGraphPreview
        href="https://example.com/article"
        preview={{
          description: `Visit ${longUrl} for additional context`,
        }}
      />
    );

    const wrappedSegment = screen.getByText(longUrl);
    expect(wrappedSegment.tagName).toBe("SPAN");
    expect(wrappedSegment).toHaveClass("tw-break-all");
  });

  it("renders borderless image-only card when imageOnly is enabled", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/article");

    render(
      <OpenGraphPreview
        href="https://example.com/article"
        imageOnly={true}
        hideActions={true}
        preview={{
          title: "Example Title",
          description: "An example description",
          siteName: "Example.com",
          image: "https://cdn.example.com/preview.png",
        }}
      />
    );

    const card = screen.getByTestId("og-preview-card");
    expect(card).toBeInTheDocument();
    expect(card).not.toHaveClass("tw-border");
    expect(screen.queryByText("Example.com")).toBeNull();
    expect(screen.queryByText("An example description")).toBeNull();
    expect(screen.queryByTestId("href-buttons")).toBeNull();
    expect(screen.getByAltText("Example Title")).toHaveAttribute(
      "src",
      "https://cdn.example.com/preview.png"
    );
  });

  it("renders first-party The Memes collection cards without duplicate mint counts", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue("/the-memes/509");

    render(
      <OpenGraphPreview
        href="https://6529.io/the-memes/509"
        preview={{
          type: "6529.collection",
          kind: "the-memes",
          title: "The Collective Synapse",
          kicker: "The Memes #509",
          people: [{ label: "by", name: "elnaz555", href: "/elnaz555" }],
          liveMint: { mintedCount: 159, maxCount: 329 },
          facts: [
            { label: "TDH rate", value: "25.1" },
            { label: "Season", value: "15" },
            { label: "Mint date", value: "1 Jun 2026" },
          ],
          image: { url: "https://cdn.6529.io/memes/509.png" },
        }}
      />
    );

    expect(
      screen.getByTestId("6529-collection-preview-card")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("6529-collection-preview-image-frame")
    ).toHaveClass("tw-bg-black", "tw-border-black");
    expect(screen.getByAltText("The Collective Synapse")).toHaveClass(
      "tw-object-contain"
    );
    expect(screen.getAllByText("The Memes #509")).toHaveLength(1);
    expect(screen.getByText("The Collective Synapse")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "elnaz555" })).toHaveAttribute(
      "href",
      "/elnaz555"
    );
    expect(screen.getByText("Minting Live")).toBeInTheDocument();
    expect(screen.getByText("Minted")).toBeInTheDocument();
    expect(screen.getByText("159 / 329")).toBeInTheDocument();
    expect(screen.queryByText("Edition size")).toBeNull();
    expect(screen.getByText("TDH rate")).toBeInTheDocument();
    expect(screen.getByText("25.1")).toBeInTheDocument();
    expect(screen.getByText("Season")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("shows current live mint count when Manifold max is unavailable", () => {
    render(
      <OpenGraphPreview
        href="https://6529.io/the-memes/522"
        preview={{
          type: "6529.collection",
          kind: "the-memes",
          title: "Sentenced to Survive",
          kicker: "The Memes #522",
          liveMint: { mintedCount: 159 },
          facts: [],
        }}
      />
    );

    expect(screen.getByText("Minting Live")).toBeInTheDocument();
    expect(screen.getByText("Minted")).toBeInTheDocument();
    expect(screen.getByText("159")).toBeInTheDocument();
  });

  it("renders first-party NextGen cards with capped rare trait chips", () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue(
      "/nextgen/token/10000000514"
    );

    render(
      <OpenGraphPreview
        href="https://6529.io/nextgen/token/10000000514"
        preview={{
          type: "6529.collection",
          kind: "nextgen-token",
          title: "Pebbles #514",
          kicker: "NextGen \u00b7 Pebbles",
          people: [
            { label: "by", name: "Zeblocks", href: "/zeblocks" },
            {
              label: "Collector",
              name: "perilousvault.eth",
              href: "/perilousvault",
            },
          ],
          facts: [
            { label: "Rarity", value: "#86 / 1,000" },
            { label: "Mint date", value: "11 Apr 2024" },
          ],
          traits: [
            { label: "Palette", value: "Blueprint" },
            { label: "Mint Type", value: "Public" },
            { label: "Color Density", value: "Sparse" },
          ],
          image: { url: "https://cdn.6529.io/nextgen/514.png" },
        }}
      />
    );

    expect(
      screen.getByTestId("6529-collection-preview-card")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("6529-collection-preview-image-frame")
    ).toHaveClass("tw-bg-black", "tw-border-black");
    expect(screen.getByAltText("Pebbles #514")).toHaveClass(
      "tw-object-contain"
    );
    expect(screen.getByText("Pebbles #514")).toBeInTheDocument();
    expect(screen.getByText("NextGen \u00b7 Pebbles")).toBeInTheDocument();
    expect(screen.getByText("Rarity")).toBeInTheDocument();
    expect(screen.getByText("#86 / 1,000")).toBeInTheDocument();
    expect(screen.getByText("Palette: Blueprint")).toBeInTheDocument();
    expect(screen.getByText("Mint Type: Public")).toBeInTheDocument();
    expect(screen.getByText("Color Density: Sparse")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zeblocks" })).toHaveAttribute(
      "href",
      "/zeblocks"
    );
    expect(
      screen.getByRole("link", { name: "perilousvault.eth" })
    ).toHaveAttribute("href", "/perilousvault");
  });
});
