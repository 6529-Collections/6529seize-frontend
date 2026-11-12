import { Capacitor } from "@capacitor/core";
import { render, screen } from "@testing-library/react";
import React from "react";

import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";
import MarketplacePreviewPlaceholder from "@/components/waves/marketplace/MarketplacePreviewPlaceholder";
import MarketplaceUnavailableCard from "@/components/waves/marketplace/MarketplaceUnavailableCard";

describe("Marketplace placeholder cards", () => {
  it("renders stable media frame in non-compact placeholder mode", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplacePreviewPlaceholder
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          compact={false}
        />
      </LinkPreviewProvider>
    );

    const media = screen.getByTestId("marketplace-preview-placeholder-media");
    expect(media).toHaveClass("tw-h-64");
    expect(media).toHaveClass("md:tw-h-72");
    expect(
      screen.getByTestId("marketplace-preview-placeholder-footer")
    ).toBeInTheDocument();
  });

  it("keeps placeholder layout the same in compact mode", () => {
    render(
      <MarketplacePreviewPlaceholder
        href="https://manifold.xyz/@andrew-hooker/id/4098474224"
        compact={true}
      />
    );

    expect(
      screen.getByTestId("marketplace-preview-placeholder-media")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("marketplace-preview-placeholder-footer")
    ).toBeNull();
  });

  it("renders stable unavailable card with compact mode support", () => {
    render(
      <MarketplaceUnavailableCard
        href="https://manifold.xyz/@andrew-hooker/id/4098474224"
        compact={true}
      />
    );

    const media = screen.getByTestId("marketplace-preview-unavailable-media");
    expect(media).toHaveClass("tw-h-64");
    expect(media).toHaveClass("md:tw-h-72");
    expect(screen.getByText("Preview unavailable")).toBeInTheDocument();
    expect(
      screen.queryByTestId("marketplace-preview-unavailable-footer")
    ).toBeNull();
  });

  it("links the unavailable card to an on-site path in the current tab", () => {
    render(
      <MarketplaceUnavailableCard
        href="https://test.6529.io/the-memes/1"
        compact={true}
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/the-memes/1");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens an unavailable card whose path starts with // in a new tab", () => {
    const href = "https://test.6529.io//other.example/path";
    render(<MarketplaceUnavailableCard href={href} compact={true} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders unavailable footer row in non-compact mode", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceUnavailableCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          compact={false}
        />
      </LinkPreviewProvider>
    );

    expect(
      screen.getByTestId("marketplace-preview-unavailable-footer")
    ).toBeInTheDocument();
  });
});

it("preserves the original link when a marketplace preview fails on iOS", () => {
  const platform = jest.spyOn(Capacitor, "getPlatform").mockReturnValue("ios");
  try {
    render(
      <MarketplaceUnavailableCard href="https://manifold.xyz/@creator/id/123" />
    );
    expect(
      screen.getByTestId("marketplace-preview-unavailable-media")
    ).toBeVisible();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://manifold.xyz/@creator/id/123"
    );
  } finally {
    platform.mockRestore();
  }
});
