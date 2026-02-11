import { render, screen } from "@testing-library/react";
import React from "react";

import ManifoldItemPreviewCard from "@/components/waves/ManifoldItemPreviewCard";
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

describe("ManifoldItemPreviewCard", () => {
  it("renders uncropped media and keeps title outside media", () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";
    const title = "The Big Bang";

    const { container } = render(
      <LinkPreviewProvider variant="home">
        <ManifoldItemPreviewCard
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
    expect(media).toHaveClass("tw-min-h-[10rem]");
    expect(media).not.toContainElement(titleElement);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-gradient"]')).toBeNull();
  });

  it("hides title row in image-only mode", () => {
    render(
      <LinkPreviewProvider variant="home">
        <ManifoldItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          title="The Big Bang"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          imageOnly={true}
        />
      </LinkPreviewProvider>
    );

    expect(screen.getByTestId("manifold-item-media")).toBeInTheDocument();
    expect(screen.queryByTestId("manifold-item-title")).toBeNull();
  });

  it("hides action buttons when requested in chat variant", () => {
    const props = {
      href: "https://manifold.xyz/@andrew-hooker/id/4098474224",
      title: "The Big Bang",
      mediaUrl: "https://arweave.net/test-image",
      mediaMimeType: "image/*",
    };

    const { rerender } = render(
      <ManifoldItemPreviewCard {...props} hideActions={false} />
    );
    expect(screen.getByTestId("href-buttons")).toBeInTheDocument();

    rerender(<ManifoldItemPreviewCard {...props} hideActions={true} />);
    expect(screen.queryByTestId("href-buttons")).toBeNull();
  });
});
