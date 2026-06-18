import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

const mockGetArweaveGatewayFallbackUrls = jest.fn();
const mockShouldUseIframeFallbackTimeout = jest.fn();
const mockSandboxedExternalIframe = jest.fn();

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
jest.mock("@/components/common/SandboxedExternalIframe", () => (props: any) => {
  React.useEffect(() => {
    props.onVisible?.();
  }, [props.onVisible]);
  mockSandboxedExternalIframe(props);
  return (
    <iframe
      ref={props.iframeRef}
      data-testid="iframe"
      data-src={props.src}
      data-title={props.title}
      title={props.title}
      data-class-name={props.className}
      data-container-class-name={props.containerClassName}
    />
  );
});
jest.mock(
  "@/components/drops/media/InteractiveMediaLoadGate",
  () => (props: any) => (
    <button data-testid="load-gate" onClick={props.onLoad} type="button">
      {props.children}
    </button>
  )
);
jest.mock(
  "@/components/drops/view/item/content/media/UnsupportedMediaLink",
  () => ({ __esModule: true, default: () => <a href="file.txt">file.txt</a> })
);
jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/helpers/media-download.helpers", () => ({
  __esModule: true,
  getDownloadFilenameFromUrl: jest.fn((_url: string) => "media.html"),
  downloadMediaUrl: jest.fn(),
  triggerDirectDownload: jest.fn(),
}));

jest.mock(
  "next/dynamic",
  () => (importFn: any) =>
    importFn().then
      ? () => <div data-testid="glb" />
      : () => <div data-testid="glb" />
);

jest.mock("@/components/nft-image/utils/gateway-fallback", () => ({
  getMediaGatewayFallbackUrls: (...args: unknown[]) =>
    mockGetArweaveGatewayFallbackUrls(...args),
  shouldUseIframeFallbackTimeout: (...args: unknown[]) =>
    mockShouldUseIframeFallbackTimeout(...args),
}));

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";

describe("MediaDisplay", () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockSandboxedExternalIframe.mockClear();
    mockGetArweaveGatewayFallbackUrls.mockImplementation((url: string) => {
      if (url === "ipfs://hash") {
        return ["https://media.6529.io/ipfs/hash"];
      }
      return [url];
    });
    mockShouldUseIframeFallbackTimeout.mockReturnValue(true);
  });

  it("renders image", () => {
    render(<MediaDisplay media_mime_type="image/png" media_url="img.png" />);
    expect(screen.getByTestId("image")).toHaveAttribute("data-src", "img.png");
  });

  it("renders video", () => {
    render(<MediaDisplay media_mime_type="video/mp4" media_url="vid.mp4" />);
    const node = screen.getByTestId("video");
    expect(node).toHaveAttribute("data-src", "vid.mp4");
    expect(node).toHaveAttribute("data-controls", "true");
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
      "https://media.6529.io/ipfs/hash"
    );
    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-title",
      "Interactive HTML media"
    );
    expect(screen.getByRole("button", { name: "Full screen" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Download media" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
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
      "https://media.6529.io/ipfs/hash"
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
      "https://media.6529.io/ipfs/hash"
    );
  });

  it("renders unknown media as a compact link", () => {
    render(<MediaDisplay media_mime_type="text/plain" media_url="file.txt" />);

    expect(screen.getByRole("link", { name: "file.txt" })).toBeInTheDocument();
  });

  it("does not render unsupported media preview controls", () => {
    render(
      <MediaDisplay
        media_mime_type="text/plain"
        media_url="file.txt"
        disableMediaInteraction
      />
    );

    expect(
      screen.queryByRole("button", { name: "Download attachment" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "file.txt" })).toBeInTheDocument();
  });

  it("does not auto-advance ipfs html if the timeout fallback is disabled", () => {
    jest.useFakeTimers();
    mockGetArweaveGatewayFallbackUrls.mockReturnValue([
      "https://ipfs.6529.io/ipfs/hash",
      "https://media.6529.io/ipfs/hash",
    ]);
    mockShouldUseIframeFallbackTimeout.mockReturnValue(false);

    render(
      <MediaDisplay
        media_mime_type="text/html"
        media_url="https://ipfs.6529.io/ipfs/hash"
      />
    );

    act(() => {
      jest.advanceTimersByTime(8000);
    });

    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-src",
      "https://ipfs.6529.io/ipfs/hash"
    );
  });

  it("auto-advances html when timeout fallback is enabled", async () => {
    jest.useFakeTimers();
    mockGetArweaveGatewayFallbackUrls.mockReturnValue([
      "https://arweave.net/tx",
      "https://ardrive.net/tx",
    ]);
    mockShouldUseIframeFallbackTimeout.mockReturnValue(true);

    render(
      <MediaDisplay
        media_mime_type="text/html"
        media_url="https://arweave.net/tx"
      />
    );

    act(() => {
      mockSandboxedExternalIframe.mock.calls.at(-1)?.[0].onVisible?.();
    });

    act(() => {
      jest.advanceTimersByTime(8000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("iframe")).toHaveAttribute(
      "data-src",
      "https://ardrive.net/tx"
    );
  });
});
