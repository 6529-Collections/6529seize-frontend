import { render, screen } from "@testing-library/react";
import React from "react";

import MarketplaceItemPreviewCard from "@/components/waves/MarketplaceItemPreviewCard";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="media-display"
      data-mime={props.media_mime_type}
      data-url={props.media_url}
      data-disable={String(props.disableMediaInteraction)}
    />
  ),
}));

describe("MarketplaceItemPreviewCard", () => {
  it("renders media and no-price CTA with marketplace logo", () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    const { container } = render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href={href}
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
        />
      </LinkPreviewProvider>
    );

    const media = screen.getByTestId("manifold-item-media");
    const mediaDisplay = screen.getByTestId("media-display");
    const mediaLink = screen.getByTestId("marketplace-item-media-link");
    const ctaLink = screen.getByTestId("marketplace-item-cta-link");

    expect(mediaLink).toHaveAttribute("href", href);
    expect(ctaLink).toHaveAttribute("href", href);
    expect(ctaLink).toHaveAttribute("target", "_blank");
    expect(ctaLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(mediaDisplay).toHaveAttribute(
      "data-url",
      "https://arweave.net/test-image"
    );
    expect(mediaDisplay).toHaveAttribute("data-mime", "image/*");
    expect(mediaDisplay).toHaveAttribute("data-disable", "true");
    expect(media).toContainElement(mediaDisplay);
    expect(media).toHaveClass("tw-aspect-[16/9]");
    expect(media).toHaveClass("tw-min-h-[14rem]");
    expect(screen.getByTestId("marketplace-item-cta-label")).toHaveTextContent(
      "View on Manifold"
    );
    expect(screen.getByAltText("Manifold logo")).toBeInTheDocument();
    expect(screen.queryByTestId("manifold-item-price")).toBeNull();
    expect(container.querySelector('[class*="bg-gradient"]')).toBeNull();
  });

  it("renders price CTA in compact mode", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          compact={true}
          price=" 1.25 ETH "
        />
      </LinkPreviewProvider>
    );

    expect(screen.getByTestId("manifold-item-media")).toBeInTheDocument();
    expect(screen.getByTestId("manifold-item-price")).toHaveTextContent(
      "1.25 ETH"
    );
    expect(screen.getByAltText("Manifold logo")).toBeInTheDocument();
    expect(screen.getByTestId("manifold-item-card")).not.toHaveClass(
      "tw-border"
    );
  });

  it("falls back to generic CTA label when marketplace cannot be resolved", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://example.com/item/1"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
        />
      </LinkPreviewProvider>
    );

    expect(screen.getByTestId("marketplace-item-cta-label")).toHaveTextContent(
      "View listing"
    );
    expect(screen.queryByAltText(/logo$/i)).toBeNull();
  });

  it("hides overlay action buttons when requested", () => {
    const props = {
      href: "https://manifold.xyz/@andrew-hooker/id/4098474224",
      mediaUrl: "https://arweave.net/test-image",
      mediaMimeType: "image/*",
    };

    const { rerender } = render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard {...props} hideActions={false} />
      </LinkPreviewProvider>
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(3);

    rerender(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard {...props} hideActions={true} />
      </LinkPreviewProvider>
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
