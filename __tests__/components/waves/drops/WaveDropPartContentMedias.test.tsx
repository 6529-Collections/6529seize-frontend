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
    default: (props: { readonly galleryItemId?: string | undefined }) => (
      <div data-testid="drop-media" data-gallery-item-id={props.galleryItemId} />
    ),
  })
);

jest.mock("@/components/waves/drops/WaveDropPartContentMediaImage", () => ({
  __esModule: true,
  default: ({
    galleryItemId,
    src,
  }: {
    readonly galleryItemId?: string | undefined;
    readonly src: string;
  }) => (
    <div
      data-testid="wave-image-media"
      data-src={src}
      data-gallery-item-id={galleryItemId}
    />
  ),
}));

const basePart: any = {
  content: "",
  media: [
    { mime_type: "image/png", url: "u1" },
    { mime_type: "video/mp4", url: "u2" },
  ],
};

describe("WaveDropPartContentMedias", () => {
  it("returns null when no media", () => {
    const { container } = render(
      <WaveDropPartContentMedias activePart={{ ...basePart, media: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders standard media actions for image and video media by default", () => {
    const { container } = render(
      <WaveDropPartContentMedias activePart={basePart} />
    );

    expect(screen.getByTestId("wave-image-media")).toBeInTheDocument();
    expect(screen.getByTestId("wave-image-media")).toHaveAttribute(
      "data-gallery-item-id",
      "drop-image-gallery:media:0:u1"
    );
    expect(screen.getByTestId("drop-media")).toBeInTheDocument();
    expect(container.querySelector(".tw-grid.tw-grid-cols-1")).toBeNull();
  });

  it("groups consecutive image media in one responsive grid", () => {
    const { container } = render(
      <WaveDropPartContentMedias
        activePart={{
          ...basePart,
          media: [
            { mime_type: "image/png", url: "u1" },
            { mime_type: "image/jpeg", url: "u2" },
          ],
        }}
      />
    );

    const group = container.querySelector(".tw-grid.tw-grid-cols-1");

    expect(group).not.toBeNull();
    expect(group).toHaveClass(
      "tw-w-full",
      "tw-gap-2",
      "sm:tw-grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),16rem))]"
    );
    expect(screen.getAllByTestId("wave-image-media")).toHaveLength(2);
    expect(
      screen
        .getAllByTestId("wave-image-media")
        .map((image) => image.getAttribute("data-gallery-item-id"))
    ).toEqual([
      "drop-image-gallery:media:0:u1",
      "drop-image-gallery:media:1:u2",
    ]);
  });

  it("uses MediaDisplay when disabled", () => {
    const { container } = render(
      <WaveDropPartContentMedias
        activePart={{
          ...basePart,
          media: [
            { mime_type: "image/png", url: "u1" },
            { mime_type: "image/jpeg", url: "u2" },
          ],
        }}
        disableMediaInteraction
      />
    );

    expect(screen.getAllByTestId("media-display")).toHaveLength(2);
    expect(container.querySelector(".tw-grid.tw-grid-cols-1")).toBeNull();
  });
});
