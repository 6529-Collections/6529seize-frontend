import { act, render, screen } from "@testing-library/react";
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
    >
      {props.media_mime_type.toLowerCase().includes("image") ? (
        <img alt="" src={props.media_url} />
      ) : null}
    </div>
  ),
}));

const setElementDimensions = (
  element: HTMLElement,
  width: number,
  height: number
) => {
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: height,
  });
};

const setImageNaturalSize = (
  image: HTMLImageElement,
  width: number,
  height: number
) => {
  Object.defineProperty(image, "naturalWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(image, "naturalHeight", {
    configurable: true,
    value: height,
  });
};

class TestResizeObserver implements ResizeObserver {
  private static readonly instances = new Set<TestResizeObserver>();
  private target: Element | null = null;
  public readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    TestResizeObserver.instances.add(this);
  }

  static triggerAll() {
    for (const instance of TestResizeObserver.instances) {
      if (instance.target) {
        instance.callback([], instance);
      }
    }
  }

  static clear() {
    TestResizeObserver.instances.clear();
  }

  observe(target: Element) {
    this.target = target;
  }

  unobserve() {}

  disconnect() {
    TestResizeObserver.instances.delete(this);
    this.target = null;
  }
}

describe("MarketplaceItemPreviewCard", () => {
  const originalResizeObserver = global.ResizeObserver;
  const originalWindowResizeObserver = window.ResizeObserver;

  beforeEach(() => {
    global.ResizeObserver = TestResizeObserver;
    window.ResizeObserver = TestResizeObserver;
    TestResizeObserver.clear();
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
    window.ResizeObserver = originalWindowResizeObserver;
  });

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
    expect(ctaLink).toHaveAttribute("aria-label", "Open on Manifold");
    expect(ctaLink).toHaveClass("tw-absolute", "tw-right-3", "tw-top-[5.5rem]");
    expect(screen.getByAltText("Manifold logo")).toBeInTheDocument();
    expect(
      screen.queryByTestId("marketplace-item-cta-fallback-icon")
    ).toBeNull();
    expect(screen.queryByTestId("marketplace-item-cta-label")).toBeNull();
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
    const ctaLink = screen.getByTestId("marketplace-item-cta-link");
    expect(ctaLink).toHaveClass("tw-absolute", "tw-right-3", "tw-top-[5.5rem]");
    expect(ctaLink).toHaveAttribute(
      "aria-label",
      "Open on Manifold - 1.25 ETH"
    );
    expect(ctaLink).toHaveClass("tw-rounded-full");
    expect(screen.getByTestId("manifold-item-price")).toHaveTextContent(
      "1.25 ETH"
    );
    expect(screen.getByAltText("Manifold logo")).toBeInTheDocument();
  });

  it("renders title below media in non-compact mode when title is available", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          title="  Wave Artifact  "
        />
      </LinkPreviewProvider>
    );

    expect(
      screen.getByTestId("marketplace-item-title-row")
    ).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-item-title")).toHaveTextContent(
      "Wave Artifact"
    );
  });

  it("syncs title row width to displayed image width", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          title="Wave Artifact"
        />
      </LinkPreviewProvider>
    );

    const mediaFrame = screen.getByTestId("manifold-item-media");
    const titleRow = screen.getByTestId("marketplace-item-title-row");
    const image = mediaFrame.querySelector("img");

    expect(image).not.toBeNull();
    setElementDimensions(mediaFrame, 320, 180);
    setImageNaturalSize(image as HTMLImageElement, 1600, 900);

    act(() => {
      TestResizeObserver.triggerAll();
    });

    expect(titleRow.style.width).toBe("320px");
    expect(titleRow.style.maxWidth).toBe("100%");
  });

  it("keeps title row full width when image dimensions are unavailable", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          title="Wave Artifact"
        />
      </LinkPreviewProvider>
    );

    const mediaFrame = screen.getByTestId("manifold-item-media");
    const titleRow = screen.getByTestId("marketplace-item-title-row");
    const image = mediaFrame.querySelector("img");

    expect(image).not.toBeNull();
    setElementDimensions(mediaFrame, 320, 180);
    setImageNaturalSize(image as HTMLImageElement, 0, 0);

    act(() => {
      TestResizeObserver.triggerAll();
    });

    expect(titleRow.style.width).toBe("100%");
    expect(titleRow.style.maxWidth).toBe("");
  });

  it("resets measured title width when media changes to non-image", () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    const { rerender } = render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href={href}
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          title="Wave Artifact"
        />
      </LinkPreviewProvider>
    );

    const mediaFrame = screen.getByTestId("manifold-item-media");
    const titleRow = screen.getByTestId("marketplace-item-title-row");
    const image = mediaFrame.querySelector("img");

    expect(image).not.toBeNull();
    setElementDimensions(mediaFrame, 320, 180);
    setImageNaturalSize(image as HTMLImageElement, 1600, 900);

    act(() => {
      TestResizeObserver.triggerAll();
    });

    expect(titleRow.style.width).toBe("320px");
    expect(titleRow.style.maxWidth).toBe("100%");

    rerender(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href={href}
          mediaUrl="https://arweave.net/test-video"
          mediaMimeType="video/mp4"
          title="Wave Artifact"
        />
      </LinkPreviewProvider>
    );

    expect(screen.getByTestId("marketplace-item-title-row").style.width).toBe(
      "100%"
    );
    expect(
      screen.getByTestId("marketplace-item-title-row").style.maxWidth
    ).toBe("");
  });

  it("does not render title row in compact mode", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://manifold.xyz/@andrew-hooker/id/4098474224"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          compact={true}
          title="Wave Artifact"
        />
      </LinkPreviewProvider>
    );

    expect(screen.queryByTestId("marketplace-item-title-row")).toBeNull();
    expect(screen.queryByTestId("marketplace-item-title")).toBeNull();
  });

  it("renders fallback icon CTA when marketplace cannot be resolved", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://example.com/item/1"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
        />
      </LinkPreviewProvider>
    );

    expect(
      screen.getByTestId("marketplace-item-cta-fallback-icon")
    ).toBeInTheDocument();
    const ctaLink = screen.getByTestId("marketplace-item-cta-link");
    expect(ctaLink).toHaveAttribute("aria-label", "Open listing");
    expect(ctaLink).toHaveClass("tw-absolute", "tw-right-3", "tw-top-[5.5rem]");
    expect(screen.queryByTestId("marketplace-item-cta-label")).toBeNull();
    expect(screen.queryByAltText(/logo$/i)).toBeNull();
  });

  it("renders fallback icon and price in top-right CTA when marketplace is unknown", () => {
    render(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard
          href="https://example.com/item/2"
          mediaUrl="https://arweave.net/test-image"
          mediaMimeType="image/*"
          price=" 0.42 ETH "
        />
      </LinkPreviewProvider>
    );

    const ctaLink = screen.getByTestId("marketplace-item-cta-link");
    expect(ctaLink).toHaveClass("tw-absolute", "tw-right-3", "tw-top-[5.5rem]");
    expect(ctaLink).toHaveAttribute("aria-label", "Open listing - 0.42 ETH");
    expect(
      screen.getByTestId("marketplace-item-cta-fallback-icon")
    ).toBeInTheDocument();
    expect(screen.getByTestId("manifold-item-price")).toHaveTextContent(
      "0.42 ETH"
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
    expect(screen.getByTestId("marketplace-item-cta-link")).toHaveClass(
      "tw-top-[5.5rem]"
    );

    rerender(
      <LinkPreviewProvider variant="home">
        <MarketplaceItemPreviewCard {...props} hideActions={true} />
      </LinkPreviewProvider>
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByTestId("marketplace-item-cta-link")).toHaveClass(
      "tw-top-3"
    );
  });
});
