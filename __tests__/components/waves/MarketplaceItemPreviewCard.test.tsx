import { render, screen } from "@testing-library/react";
import React from "react";

import MarketplaceItemPreviewCard from "@/components/waves/MarketplaceItemPreviewCard";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";

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

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: () => <div data-testid="href-buttons" />,
}));

describe("MarketplaceItemPreviewCard", () => {
  it("renders uncropped media and keeps title outside media", () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";
    const title = "The Big Bang";

    const { container } = render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href={href}
          title={title}
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
        />
      </LinkPreviewProvider>
    );

    const media = screen.getByTestId("manifold-item-media");
    const titleElement = screen.getByTestId("manifold-item-title");
    const mediaDisplay = screen.getByTestId("media-display");
    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", href);
    expect(mediaDisplay).toHaveAttribute(
      "data-url",
      "https://arweave.net/test-image"
    );
    expect(mediaDisplay).toHaveAttribute("data-mime", "image/*");
    expect(mediaDisplay).toHaveAttribute("data-disable", "true");
    expect(media).toContainElement(mediaDisplay);
    expect(media).toHaveClass("tw-aspect-[16/9]");
    expect(media).toHaveClass("tw-min-h-[14rem]");
    expect(media).not.toContainElement(titleElement);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-gradient"]')).toBeNull();
  });

  it("hides title row in compact mode", () => {
    const { container } = render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          title="The Big Bang"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          compact={true}
        />
      </LinkPreviewProvider>
    );

    expect(screen.getByTestId("manifold-item-media")).toBeInTheDocument();
    expect(screen.queryByTestId("manifold-item-title")).toBeNull();
    expect(screen.getByTestId("manifold-item-card")).not.toHaveClass(
      "tw-border"
    );
    expect(container.querySelector('[class*="tw-border-white/10"]')).toBeNull();
  });

  it("hides action buttons when requested in chat variant", () => {
    const props = {
      href: "https://manifold.xyz/@andrew-hooker/id/4098474224",
      title: "The Big Bang",
      mediaUrl: "https://arweave.net/test-image",
      mediaMimeType: "image/*",
    };

    const { rerender } = render(
      <MarketplaceItemPreviewCard {...props} hideActions={false} />
    );
    expect(screen.getByTestId("href-buttons")).toBeInTheDocument();

    rerender(<MarketplaceItemPreviewCard {...props} hideActions={true} />);
    expect(screen.queryByTestId("href-buttons")).toBeNull();
  });
});
