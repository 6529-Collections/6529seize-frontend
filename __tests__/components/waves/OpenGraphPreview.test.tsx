import { render, screen } from "@testing-library/react";
import React from "react";

import OpenGraphPreview, {
  getFirstPartyOpenGraphPreviewKind,
} from "@/components/waves/OpenGraphPreview";

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
    return <img alt={alt} {...rest} />;
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
          image: "https://cdn.example.com/preview.png",
        }}
      />
    );

    const card = screen.getByTestId("og-preview-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("tw-h-full");
    expect(card.firstElementChild).toHaveClass(
      "tw-flex-row",
      "tw-h-full",
      "tw-min-h-0"
    );
    expect(screen.getByText("Example.com")).toBeInTheDocument();
    const titleLinks = screen.getAllByRole("link", { name: "Example Title" });
    expect(titleLinks).toHaveLength(2);
    expect(titleLinks[0]).toHaveClass(
      "tw-h-full",
      "tw-w-28",
      "sm:tw-w-32",
      "md:tw-w-44"
    );
    const titleLink = titleLinks[1];
    expect(titleLink).toHaveAttribute("href", "/article");
    expect(titleLink).not.toHaveAttribute("target");
    const image = screen.getByAltText("Example Title");
    expect(image).toHaveAttribute("src", "https://cdn.example.com/preview.png");
    expect(image).toHaveAttribute(
      "sizes",
      "(max-width: 640px) 7rem, (max-width: 768px) 8rem, 176px"
    );
    expect(image.parentElement).toHaveClass("tw-h-full", "tw-w-full");
    expect(image.parentElement).not.toHaveClass("tw-aspect-[16/9]");
    expect(screen.getByText("An example description")).toBeInTheDocument();
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/article");
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

  it("identifies generated first-party OpenGraph metadata", () => {
    expect(
      getFirstPartyOpenGraphPreviewKind({
        image: "https://6529.io/api/og-metadata/profiles/punk6529",
      })
    ).toBe("profile");
    expect(
      getFirstPartyOpenGraphPreviewKind({
        image: "https://staging.6529.io/api/og-metadata/drops/123",
      })
    ).toBe("drop");
    expect(
      getFirstPartyOpenGraphPreviewKind({
        image: "https://6529.io/api/og-metadata/waves/wave-id",
      })
    ).toBe("wave");
    expect(
      getFirstPartyOpenGraphPreviewKind({
        image: "https://example.com/preview.png",
      })
    ).toBeNull();
    expect(
      getFirstPartyOpenGraphPreviewKind({
        image: "https://evil.example.com/api/og-metadata/profiles/x",
      })
    ).toBeNull();
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
          facts: [
            { label: "Edition size", value: "328" },
            { label: "TDH rate", value: "25.1" },
            { label: "Season", value: "15" },
            { label: "Mint date", value: "1 Jun 2026" },
          ],
          image: { url: "https://cdn.6529.io/memes/509.png" },
        }}
      />
    );

    expect(screen.getByTestId("6529-collection-preview-card")).toBeInTheDocument();
    expect(screen.getAllByText("The Memes #509")).toHaveLength(1);
    expect(screen.getByText("The Collective Synapse")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "elnaz555" })).toHaveAttribute(
      "href",
      "/elnaz555"
    );
    expect(screen.getByText("Edition size")).toBeInTheDocument();
    expect(screen.getByText("328")).toBeInTheDocument();
    expect(screen.getByText("TDH rate")).toBeInTheDocument();
    expect(screen.getByText("25.1")).toBeInTheDocument();
    expect(screen.getByText("Season")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.queryByText("158/328")).toBeNull();
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
          people: [{ label: "by", name: "Zeblocks", href: "/zeblocks" }],
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

    expect(screen.getByTestId("6529-collection-preview-card")).toBeInTheDocument();
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
  });
});
