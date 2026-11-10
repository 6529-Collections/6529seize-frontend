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

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    publicEnv: { ...actual.publicEnv, BASE_ENDPOINT: "https://example.com" },
  };
});

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: function MockChatItemHrefButtons(props: any) {
    return (
      <div data-testid="href-buttons">{props.relativeHref ?? "undefined"}</div>
    );
  },
}));

const proxied = (url: string, kind: "image" | "icon" = "image") =>
  `/api/og-metadata/image?${new URLSearchParams({
    url,
    w: kind === "image" ? "640" : "64",
  }).toString()}`;

describe("OpenGraphPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton when preview is undefined", () => {
    render(<OpenGraphPreview href="https://example.com/article" />);

    const skeleton = screen.getByTestId("og-preview-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.parentElement).toHaveClass("tw-h-full");
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/article");
  });

  it("hides action buttons when hideActions is true", () => {
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
    expect(image).toHaveAttribute(
      "src",
      proxied("https://cdn.example.com/preview.png")
    );
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
    ).toHaveAttribute("src", proxied("https://mini.example/preview.png"));
    expect(screen.getByAltText("")).toHaveAttribute(
      "src",
      proxied("https://mini.example/splash.png", "icon")
    );
  });

  it("renders legacy Farcaster frame titles before the site label", () => {
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
    render(
      <OpenGraphPreview
        href="https://example.com/research/notes"
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
    render(
      <OpenGraphPreview
        href="https://example.com/research/notes"
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
      proxied("https://cdn.othersite.com/img.jpg")
    );
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("undefined");
  });

  it("uses secureUrl fields when provided", () => {
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
      proxied("https://cdn.example.com/secure.png")
    );
  });

  it("wraps long unbroken segments to keep layout consistent", () => {
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
      proxied("https://cdn.example.com/preview.png")
    );
  });

  it("renders first-party The Memes collection cards without duplicate mint counts", () => {
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

  describe("preview links", () => {
    it.each([
      "https://example.com//other.example/path",
      "https://example.com/\\other.example/path",
      "https://example.com.other.example/path",
    ])("opens %s in a new tab", (href) => {
      render(
        <OpenGraphPreview href={href} preview={{ title: "Look-alike link" }} />
      );

      const card = screen.getByTestId("og-preview-card");
      expect(card).toHaveAttribute("href", href);
      expect(card).toHaveAttribute("target", "_blank");
      expect(card).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getByTestId("href-buttons")).toHaveTextContent("undefined");
    });

    it("keeps the query and fragment of an on-site link", () => {
      render(
        <OpenGraphPreview
          href="https://example.com/waves/1?drop=2#part"
          preview={{ title: "On-site link" }}
        />
      );

      const card = screen.getByTestId("og-preview-card");
      expect(card).toHaveAttribute("href", "/waves/1?drop=2#part");
      expect(card).not.toHaveAttribute("target");
    });
  });

  describe("preview media", () => {
    it("loads favicons through the image proxy", () => {
      const { container } = render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{
            title: "Research Notes",
            favicon: "https://journal.example/favicon.png",
          }}
        />
      );

      const favicon = container.querySelector('img[alt=""]');
      expect(favicon).toHaveAttribute(
        "src",
        proxied("https://journal.example/favicon.png", "icon")
      );
    });

    it("uses the first raster favicon and skips .ico and SVG icons", () => {
      const { container } = render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{
            title: "Research Notes",
            favicon: "https://journal.example/favicon.ico",
            favicons: [
              "https://journal.example/favicon.ico",
              "https://journal.example/icon.svg",
              "https://journal.example/apple-touch-icon.png",
              "https://journal.example/icon-32.webp",
            ],
          }}
        />
      );

      const favicons = container.querySelectorAll('img[alt=""]');
      expect(favicons).toHaveLength(1);
      expect(favicons[0]).toHaveAttribute(
        "src",
        proxied("https://journal.example/apple-touch-icon.png", "icon")
      );
    });

    it("requests no favicon when only .ico or SVG icons are listed", () => {
      const { container } = render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{
            title: "Research Notes",
            favicon: "https://journal.example/favicon.ico",
            favicons: [
              "https://journal.example/favicon.ico",
              "https://journal.example/icon.svg",
              "https://journal.example/icon?size=32",
            ],
          }}
        />
      );

      expect(container.querySelector('img[alt=""]')).toBeNull();
      expect(screen.getByText("Research Notes")).toBeInTheDocument();
    });

    it("omits a favicon that fails to load without retrying", () => {
      const { container } = render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{
            title: "Research Notes",
            favicon: "https://journal.example/favicon.png",
          }}
        />
      );

      const favicon = container.querySelector('img[alt=""]');
      expect(favicon).not.toBeNull();
      // A proxy refusal (for example 429 or 503) reaches the image as an error.
      fireEvent.error(favicon!);

      expect(container.querySelector('img[alt=""]')).toBeNull();
      expect(screen.getByText("Research Notes")).toBeInTheDocument();
    });

    it.each([
      "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33/1.png",
      "https://i.seadn.io/gcs/files/preview.png",
      "https://media.6529.io/ipfs/bafy/preview.png",
    ])("loads the first-party or allowed image host %s directly", (image) => {
      render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{ title: "Research Notes", image }}
        />
      );

      expect(screen.getByAltText("Research Notes")).toHaveAttribute(
        "src",
        image
      );
    });

    it("requests other hosts from the proxy as a still", () => {
      render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{
            title: "Research Notes",
            image: "https://cdn.example.com/animated.gif",
          }}
        />
      );

      const src = screen.getByAltText("Research Notes").getAttribute("src")!;
      const query = new URL(src, "https://example.com").searchParams;
      expect(src.startsWith("/api/og-metadata/image?")).toBe(true);
      expect(query.get("url")).toBe("https://cdn.example.com/animated.gif");
      expect(query.get("w")).toBe("640");
      expect(query.has("animated")).toBe(false);
    });

    it("lays the card out without an image that fails to load", () => {
      render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{
            title: "Research Notes",
            image: "https://cdn.example.com/broken.png",
          }}
        />
      );

      const card = screen.getByTestId("og-preview-card");
      fireEvent.error(screen.getByAltText("Research Notes"));

      expect(screen.queryByAltText("Research Notes")).toBeNull();
      expect(card).toHaveClass("tw-grid-cols-1");
      expect(card).not.toHaveClass("tw-grid-cols-[6rem,minmax(0,1fr)]");
    });

    it.each([
      "http://cdn.example.com/plain.png",
      "https://localhost/private.png",
      "ipfs://bafy/preview.png",
    ])("does not request the image source %s", (image) => {
      render(
        <OpenGraphPreview
          href="https://journal.example/notes"
          preview={{ title: "Research Notes", image }}
        />
      );

      expect(screen.queryByAltText("Research Notes")).toBeNull();
      expect(screen.getByTestId("og-preview-card")).toHaveClass(
        "tw-grid-cols-1"
      );
    });

    it("loads images on this site directly", () => {
      render(
        <OpenGraphPreview
          href="https://example.com/punk6529bot"
          preview={{
            title: "punk6529bot",
            image: "https://example.com/api/og-metadata/profiles/punk6529bot",
          }}
        />
      );

      expect(screen.getByAltText("punk6529bot")).toHaveAttribute(
        "src",
        "/api/og-metadata/profiles/punk6529bot"
      );
    });

    it("shows the YouTube placeholder when the thumbnail fails", () => {
      render(
        <OpenGraphPreview
          href="https://youtu.be/abc123XYZ_0"
          preview={{
            type: "youtube.video",
            title: "A Good Video",
            videoId: "abc123XYZ_0",
            watchUrl: "https://www.youtube.com/watch?v=abc123XYZ_0",
            embedUrl: "https://www.youtube-nocookie.com/embed/abc123XYZ_0",
            thumbnailUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
          }}
        />
      );

      const play = screen.getByTestId("youtube-video-play");
      fireEvent.error(
        screen.getByRole("img", { name: "YouTube thumbnail for A Good Video" })
      );

      expect(play.querySelector("img")).toBeNull();
      expect(play.querySelector(".tw-bg-gradient-to-br")).not.toBeNull();
    });
  });
});
