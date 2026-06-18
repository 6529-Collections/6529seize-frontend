import { render, screen } from "@testing-library/react";
import React from "react";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaImage",
  () => ({
    __esModule: true,
    default: (props: { readonly galleryItemId?: string | undefined }) => (
      <div data-testid="image" data-gallery-item-id={props.galleryItemId} />
    ),
  })
);
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaVideo",
  () => ({
    __esModule: true,
    default: (props: { readonly align?: string | undefined }) => (
      <div data-testid="video" data-align={props.align} />
    ),
  })
);
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaAudio",
  () => ({ __esModule: true, default: () => <div data-testid="audio" /> })
);
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMediaGLB",
  () => ({ __esModule: true, default: () => <div data-testid="glb" /> })
);
jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="html"
      data-src={props.media_url}
      data-preview-image-url={props.previewImageUrl}
      data-iframe-container-class-name={props.iframeContainerClassName}
    />
  ),
}));
jest.mock(
  "@/components/drops/view/item/content/media/UnsupportedMediaLink",
  () => ({ __esModule: true, default: () => <a href="file.txt">file.txt</a> })
);
jest.mock("next/dynamic", () => (importer: any) => () => (
  <div data-testid="glb" />
));

describe("DropListItemContentMedia", () => {
  it("renders image component", () => {
    render(
      <DropListItemContentMedia
        media_mime_type="image/png"
        media_url="img"
        galleryItemId="drop-image-gallery:media:0:img"
      />
    );
    expect(screen.getByTestId("image")).toBeInTheDocument();
    expect(screen.getByTestId("image")).toHaveAttribute(
      "data-gallery-item-id",
      "drop-image-gallery:media:0:img"
    );
  });

  it("renders video component", () => {
    render(
      <DropListItemContentMedia media_mime_type="video/mp4" media_url="vid" />
    );
    expect(screen.getByTestId("video")).toBeInTheDocument();
  });

  it("forwards video alignment", () => {
    render(
      <DropListItemContentMedia
        media_mime_type="video/mp4"
        media_url="vid"
        videoAlign="center"
      />
    );
    expect(screen.getByTestId("video")).toHaveAttribute("data-align", "center");
  });

  it("renders audio component", () => {
    render(
      <DropListItemContentMedia media_mime_type="audio/mp3" media_url="aud" />
    );
    expect(screen.getByTestId("audio")).toBeInTheDocument();
  });

  it("renders glb component", () => {
    render(
      <DropListItemContentMedia
        media_mime_type="model/gltf-binary"
        media_url="file.glb"
      />
    );
    expect(screen.getByTestId("glb")).toBeInTheDocument();
  });

  it("forwards html iframe container class name for html media", () => {
    render(
      <DropListItemContentMedia
        media_mime_type="text/html"
        media_url="file.html"
        htmlPreviewImageUrl="preview.png"
        htmlIframeContainerClassName="tw-w-full"
      />
    );
    expect(screen.getByTestId("html")).toHaveAttribute("data-src", "file.html");
    expect(screen.getByTestId("html")).toHaveAttribute(
      "data-preview-image-url",
      "preview.png"
    );
    expect(screen.getByTestId("html")).toHaveAttribute(
      "data-iframe-container-class-name",
      "tw-w-full"
    );
  });

  it("renders compact link for unknown type", () => {
    render(
      <DropListItemContentMedia
        media_mime_type="text/plain"
        media_url="file.txt"
      />
    );
    expect(screen.getByRole("link", { name: "file.txt" })).toBeInTheDocument();
  });
});
