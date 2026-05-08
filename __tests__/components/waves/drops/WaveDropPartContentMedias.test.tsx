import { render, screen } from "@testing-library/react";
import React from "react";
import WaveDropPartContentMedias from "@/components/waves/drops/WaveDropPartContentMedias";

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="media-display" />,
}));

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div
        data-testid="drop-media"
        data-image-sizes={props.imageSizes ?? ""}
        data-responsive-srcset={
          props.useResponsiveImageSrcSet ? "true" : "false"
        }
      />
    ),
  })
);

jest.mock("@/components/waves/drops/WaveDropPartContentFullWidthImage", () => ({
  __esModule: true,
  default: () => <div data-testid="full-width-image" />,
}));

const responsiveGridImageSizes = "(max-width: 767px) 100vw, 33vw";

const createImageMedia = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    mime_type: "image/png",
    url: `image-${index + 1}`,
  }));

const createPart = (media: any[]) => ({
  content: "",
  media,
});

const basePart: any = createPart([
  { mime_type: "image/png", url: "u1" },
  { mime_type: "video/mp4", url: "u2" },
]);

const getLayout = (container: HTMLElement) => {
  const layout = container.firstElementChild;
  expect(layout).not.toBeNull();
  return layout as HTMLElement;
};

describe("WaveDropPartContentMedias", () => {
  it("returns null when no media", () => {
    const { container } = render(
      <WaveDropPartContentMedias activePart={{ ...basePart, media: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders DropListItemContentMedia by default", () => {
    render(<WaveDropPartContentMedias activePart={basePart} />);
    expect(screen.getAllByTestId("drop-media")).toHaveLength(2);
  });

  it("uses MediaDisplay when disabled", () => {
    render(
      <WaveDropPartContentMedias
        activePart={basePart}
        disableMediaInteraction
      />
    );
    expect(screen.getAllByTestId("media-display")).toHaveLength(2);
  });

  it("keeps the default layout stacked", () => {
    const { container } = render(
      <WaveDropPartContentMedias activePart={createPart(createImageMedia(2))} />
    );

    const layout = getLayout(container);
    expect(layout).toHaveClass("tw-space-y-3");
    expect(layout).not.toHaveClass("tw-grid");
  });

  it("uses a responsive image grid for multiple image media", () => {
    const { container } = render(
      <WaveDropPartContentMedias
        activePart={createPart(createImageMedia(2))}
        responsiveImageGrid
      />
    );

    const layout = getLayout(container);
    const firstMedia = screen.getAllByTestId("drop-media")[0]!;
    const firstMediaContainer = firstMedia.parentElement as HTMLElement;
    expect(layout).toHaveClass("tw-grid", "tw-grid-cols-1", "tw-gap-3");
    expect(firstMedia).toHaveAttribute(
      "data-image-sizes",
      responsiveGridImageSizes
    );
    expect(firstMedia).toHaveAttribute("data-responsive-srcset", "true");
    expect(firstMediaContainer).toHaveClass(
      "md:tw-aspect-square",
      "md:tw-h-auto"
    );
  });

  it("uses two desktop columns for two image media items", () => {
    const { container } = render(
      <WaveDropPartContentMedias
        activePart={createPart(createImageMedia(2))}
        responsiveImageGrid
      />
    );

    const layout = getLayout(container);
    expect(layout).toHaveClass("md:tw-grid-cols-2");
    expect(layout).not.toHaveClass("md:tw-grid-cols-3");
  });

  it("uses three desktop columns for three or more image media items", () => {
    const { container } = render(
      <WaveDropPartContentMedias
        activePart={createPart(createImageMedia(4))}
        responsiveImageGrid
      />
    );

    const layout = getLayout(container);
    expect(layout).toHaveClass("md:tw-grid-cols-3");
    expect(layout).not.toHaveClass("md:tw-grid-cols-2");
  });

  it("keeps mixed image and video media stacked", () => {
    const { container } = render(
      <WaveDropPartContentMedias activePart={basePart} responsiveImageGrid />
    );

    const layout = getLayout(container);
    const firstMedia = screen.getAllByTestId("drop-media")[0]!;
    expect(layout).toHaveClass("tw-space-y-3");
    expect(layout).not.toHaveClass("tw-grid");
    expect(firstMedia).toHaveAttribute("data-image-sizes", "");
    expect(firstMedia).toHaveAttribute("data-responsive-srcset", "false");
  });

  it("keeps disabled media interaction stacked", () => {
    const { container } = render(
      <WaveDropPartContentMedias
        activePart={createPart(createImageMedia(2))}
        disableMediaInteraction
        responsiveImageGrid
      />
    );

    const layout = getLayout(container);
    expect(layout).toHaveClass("tw-space-y-3");
    expect(layout).not.toHaveClass("tw-grid");
    expect(screen.getAllByTestId("media-display")).toHaveLength(2);
  });

  it("keeps full-width media stacked", () => {
    const { container } = render(
      <WaveDropPartContentMedias
        activePart={createPart(createImageMedia(2))}
        fullWidthMedia
        responsiveImageGrid
      />
    );

    const layout = getLayout(container);
    expect(layout).toHaveClass("tw-space-y-3");
    expect(layout).not.toHaveClass("tw-grid");
    expect(screen.getAllByTestId("full-width-image")).toHaveLength(2);
  });
});
