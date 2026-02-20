import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import MarketplaceItemPreviewCard from "@/components/waves/MarketplaceItemPreviewCard";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";

const mockClipboardWriteText = jest.fn<Promise<void>, [string]>();

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
  beforeEach(() => {
    mockClipboardWriteText.mockReset();
    mockClipboardWriteText.mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: mockClipboardWriteText,
      },
    });
  });

  it("renders full-mode footer layout with title, price, and actions", () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href={href}
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          title="  Wave Artifact  "
          price=" 1.25 ETH "
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
    expect(screen.getByTestId("marketplace-item-footer")).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-item-title")).toHaveTextContent(
      "Wave Artifact"
    );
    expect(screen.getByTestId("manifold-item-price")).toHaveTextContent(
      "1.25 ETH"
    );
    expect(
      screen.getByTestId("marketplace-item-copy-button")
    ).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute(
      "aria-label",
      "Open on Manifold - 1.25 ETH"
    );
    expect(ctaLink).not.toHaveClass("tw-absolute");
    expect(screen.queryByAltText("Manifold logo")).toBeNull();
    expect(screen.queryByTestId("marketplace-item-title-row")).toBeNull();
  });

  it("uses fallback title in full mode and copies link from footer action", async () => {
    const href = "https://example.com/item/1";

    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href={href}
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
        />
      </LinkPreviewProvider>
    );

    expect(screen.getByTestId("marketplace-item-title")).toHaveTextContent(
      "Untitled item"
    );
    expect(screen.getByTestId("marketplace-item-cta-link")).toHaveAttribute(
      "aria-label",
      "Open listing"
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("marketplace-item-copy-button"));
      await Promise.resolve();
    });
    expect(mockClipboardWriteText).toHaveBeenCalledWith(href);
  });

  it("hides copy action in full mode when hideActions is true", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          hideActions={true}
        />
      </LinkPreviewProvider>
    );

    expect(screen.queryByTestId("marketplace-item-copy-button")).toBeNull();
    expect(screen.getByTestId("marketplace-item-cta-link")).toBeInTheDocument();
  });

  it("keeps compact mode CTA style with overlay actions when hideActions is false", () => {
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

    expect(screen.queryByTestId("marketplace-item-footer")).toBeNull();

    const ctaLink = screen.getByTestId("marketplace-item-cta-link");
    expect(ctaLink).toHaveClass("tw-absolute", "tw-right-3", "tw-top-[5.5rem]");
    expect(ctaLink).toHaveAttribute(
      "aria-label",
      "Open on Manifold - 1.25 ETH"
    );
    expect(screen.getByAltText("Manifold logo")).toBeInTheDocument();
    expect(screen.getByTestId("manifold-item-price")).toHaveTextContent(
      "1.25 ETH"
    );
    expect(
      screen.getByTestId("marketplace-item-overlay-copy-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("marketplace-item-overlay-open-link")
    ).toBeInTheDocument();
  });

  it("keeps compact mode CTA and hides overlay actions when hideActions is true", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          compact={true}
          hideActions={true}
        />
      </LinkPreviewProvider>
    );

    expect(
      screen.queryByTestId("marketplace-item-overlay-copy-button")
    ).toBeNull();
    expect(
      screen.queryByTestId("marketplace-item-overlay-open-link")
    ).toBeNull();
    expect(screen.getByTestId("marketplace-item-cta-link")).toHaveClass(
      "tw-top-3"
    );
  });

  it("renders compact fallback icon CTA when marketplace cannot be resolved", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://example.com/item/2"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          compact={true}
          price=" 0.42 ETH "
        />
      </LinkPreviewProvider>
    );

    expect(
      screen.getByTestId("marketplace-item-cta-fallback-icon")
    ).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-item-cta-link")).toHaveAttribute(
      "aria-label",
      "Open listing - 0.42 ETH"
    );
    expect(screen.getByTestId("manifold-item-price")).toHaveTextContent(
      "0.42 ETH"
    );
    expect(screen.queryByAltText(/logo$/i)).toBeNull();
  });
});
