import { render, screen } from "@testing-library/react";
import React from "react";
import WaveDropPartContentMedias from "@/components/waves/drops/WaveDropPartContentMedias";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="media-display" />,
}));

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: (props: {
      readonly galleryItemId?: string | undefined;
      readonly fillVideoContainer?: boolean | undefined;
    }) => (
      <div
        data-testid="drop-media"
        data-gallery-item-id={props.galleryItemId}
        data-fill-video-container={String(props.fillVideoContainer)}
      />
    ),
  })
);

jest.mock("@/components/waves/drops/WaveDropPartContentMediaImage", () => ({
  __esModule: true,
  default: ({
    galleryItemId,
    fillContainer,
    src,
  }: {
    readonly galleryItemId?: string | undefined;
    readonly fillContainer?: boolean | undefined;
    readonly src: string;
  }) => (
    <div
      data-testid="wave-image-media"
      data-src={src}
      data-gallery-item-id={galleryItemId}
      data-fill-container={String(fillContainer)}
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

    const image = screen.getByTestId("wave-image-media");
    const video = screen.getByTestId("drop-media");

    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("data-fill-container", "true");
    expect(image).toHaveAttribute(
      "data-gallery-item-id",
      "drop-image-gallery:media:0:u1"
    );
    expect(image.parentElement).toHaveClass("tw-h-64");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("data-fill-video-container", "false");
    expect(video.parentElement).not.toHaveClass("tw-h-64");
    expect(video.parentElement).toHaveClass("tw-items-start");
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
        .map((image) => image.getAttribute("data-fill-container"))
    ).toEqual(["true", "true"]);
    screen.getAllByTestId("wave-image-media").forEach((image) => {
      expect(image.parentElement).toHaveClass(
        "tw-min-w-0",
        "tw-w-full",
        "tw-h-64"
      );
    });
    expect(
      screen
        .getAllByTestId("wave-image-media")
        .map((image) => image.getAttribute("data-gallery-item-id"))
    ).toEqual([
      "drop-image-gallery:media:0:u1",
      "drop-image-gallery:media:1:u2",
    ]);
  });

  it("keeps full-width media intrinsic instead of reserving fixed chat height", () => {
    render(<WaveDropPartContentMedias activePart={basePart} fullWidthMedia />);

    const image = screen.getByTestId("wave-image-media");
    const video = screen.getByTestId("drop-media");

    expect(image).toHaveAttribute("data-fill-container", "false");
    expect(image.parentElement).not.toHaveClass("tw-h-64");
    expect(video).toHaveAttribute("data-fill-video-container", "false");
    expect(video.parentElement).not.toHaveClass("tw-h-64");
  });

  it("uses custom reserved height classes for normal image media only", () => {
    render(
      <WaveDropPartContentMedias
        activePart={basePart}
        mediaContainerHeightClassName="tw-h-96"
      />
    );

    expect(screen.getByTestId("wave-image-media").parentElement).toHaveClass(
      "tw-h-96"
    );
    expect(screen.getByTestId("drop-media").parentElement).not.toHaveClass(
      "tw-h-96"
    );
    expect(screen.getByTestId("drop-media")).toHaveAttribute(
      "data-fill-video-container",
      "false"
    );
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

  it("shows a processing placeholder for image media that is not ready", () => {
    render(
      <WaveDropPartContentMedias
        activePart={{
          ...basePart,
          media: [
            {
              mime_type: "image/png",
              url: "u1",
              media_status: ApiDropMediaStatus.Processing,
            },
          ],
        }}
      />
    );

    expect(screen.getByText("Processing image")).toBeInTheDocument();
    expect(screen.queryByTestId("wave-image-media")).toBeNull();
  });

  it("shows a failed placeholder for image media that failed processing", () => {
    render(
      <WaveDropPartContentMedias
        activePart={{
          ...basePart,
          media: [
            {
              mime_type: "image/png",
              url: "u1",
              media_status: ApiDropMediaStatus.Failed,
            },
          ],
        }}
      />
    );

    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("wave-image-media")).toBeNull();
  });
});
