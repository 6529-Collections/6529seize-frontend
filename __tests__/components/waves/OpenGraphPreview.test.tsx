import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Example.com")).toBeInTheDocument();
    const titleLinks = screen.getAllByRole("link", { name: "Example Title" });
    expect(titleLinks).toHaveLength(2);
    const titleLink = titleLinks[1];
    expect(titleLink).toHaveAttribute("href", "/article");
    expect(titleLink).not.toHaveAttribute("target");
    const image = screen.getByAltText("Example Title");
    expect(image).toHaveAttribute("src", "https://cdn.example.com/preview.png");
    expect(image.parentElement).toHaveClass("tw-aspect-[16/9]");
    expect(screen.getByText("An example description")).toBeInTheDocument();
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/article");
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
});
