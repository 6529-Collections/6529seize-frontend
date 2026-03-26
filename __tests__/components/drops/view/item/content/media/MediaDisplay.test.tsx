import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplayImage",
  () => (props: any) => <div data-testid="image" data-src={props.src} />
);
jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplayVideo",
  () => (props: any) => (
    <div
      data-testid="video"
      data-src={props.src}
      data-controls={String(props.showControls)}
      data-disable={String(props.disableClickHandler)}
    />
  )
);
jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplayAudio",
  () => (props: any) => (
    <div
      data-testid="audio"
      data-src={props.src}
      data-controls={String(props.showControls)}
    />
  )
);
jest.mock("@/components/common/SandboxedExternalIframe", () => (props: any) => (
  <div
    data-testid="iframe"
    data-src={props.src}
    data-title={props.title}
    data-class-name={props.className}
    data-container-class-name={props.containerClassName}
  />
));
jest.mock(
  "@/components/drops/media/InteractiveMediaLoadGate",
  () => (props: any) => (
    <button data-testid="load-gate" onClick={props.onLoad} type="button">
      {props.children}
    </button>
  )
);
jest.mock('@/components/drops/view/item/content/media/DropMediaAttachmentCard', () => (props: any) => (
  <div data-testid="attachment" data-src={props.src} data-mime={props.mimeType} />
));

jest.mock(
  "next/dynamic",
  () => (importFn: any) =>
    importFn().then
      ? () => <div data-testid="glb" />
      : () => <div data-testid="glb" />
);

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";

describe("MediaDisplay", () => {
  it("renders image", () => {
    render(<MediaDisplay media_mime_type="image/png" media_url="img.png" />);
    expect(screen.getByTestId("image")).toHaveAttribute("data-src", "img.png");
  });

  it("renders video", () => {
    render(<MediaDisplay media_mime_type="video/mp4" media_url="vid.mp4" />);
    const node = screen.getByTestId("video");
    expect(node).toHaveAttribute("data-src", "vid.mp4");
    expect(node).toHaveAttribute("data-controls", "true");
    expect(node).toHaveAttribute("data-disable", "false");
  });

  it("renders audio", () => {
    render(
      <MediaDisplay
        media_mime_type="audio/mp3"
        media_url="a.mp3"
        disableMediaInteraction
      />
    );
    const node = screen.getByTestId("audio");
    expect(node).toHaveAttribute("data-src", "a.mp3");
    expect(node).toHaveAttribute("data-controls", "false");
  });

  it("renders glb", () => {
    render(<MediaDisplay media_mime_type="model" media_url="model.glb" />);
    expect(screen.getByTestId("glb")).toBeInTheDocument();
  });

  it("renders html iframe with normalized ipfs url and descriptive title", () => {
    render(
      <MediaDisplay media_mime_type="text/html" media_url="ipfs://hash" />
    );

    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-src",
      "https://ipfs.io/ipfs/hash"
    );
    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-title",
      "Interactive HTML media"
    );
  });

  it("forwards iframe container classes for html media", () => {
    render(
      <MediaDisplay
        media_mime_type="text/html"
        media_url="ipfs://hash"
        iframeContainerClassName="tw-w-full"
      />
    );

    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-container-class-name",
      "tw-w-full"
    );
  });

  it("renders preview image instead of iframe for html when preview is provided", () => {
    render(
      <MediaDisplay
        media_mime_type="text/html"
        media_url="ipfs://hash"
        previewImageUrl="preview.png"
      />
    );

    expect(screen.getByTestId("image")).toHaveAttribute(
      "data-src",
      "preview.png"
    );
    expect(screen.queryByTestId("iframe")).not.toBeInTheDocument();
  });

  it("renders gated html iframe with normalized ipfs url after activation", () => {
    render(
      <MediaDisplay
        media_mime_type="text/html"
        media_url="ipfs://hash"
        requireInteractionToLoad
      />
    );

    fireEvent.click(screen.getByTestId("load-gate"));

    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-src",
      "https://ipfs.io/ipfs/hash"
    );
    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-title",
      "Interactive HTML media"
    );
  });

  it("keeps gated html behavior when preview is provided", () => {
    render(
      <MediaDisplay
        media_mime_type="text/html"
        media_url="ipfs://hash"
        previewImageUrl="preview.png"
        requireInteractionToLoad
      />
    );

    expect(screen.getByTestId("image")).toHaveAttribute(
      "data-src",
      "preview.png"
    );

    fireEvent.click(screen.getByTestId("load-gate"));

    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-src",
      "https://ipfs.io/ipfs/hash"
    );
  });

  it("renders empty fragment for unknown", () => {
    const { container } = render(
      <MediaDisplay media_mime_type="text/plain" media_url="file.txt" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
