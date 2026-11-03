import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createElement,
  createRef,
  forwardRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ImageMediaModal } from "@/components/drops/view/item/content/media/ImageMediaModal";

type MockImageProps = ComponentProps<"img"> & {
  fill?: boolean;
  unoptimized?: boolean;
};
jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, ...props }, ref) =>
      createElement("img", { ...props, ref })
  ),
}));
jest.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }: { children: () => ReactNode }) => children(),
  TransformComponent: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/hooks/useFullScreenSupported", () => ({
  useFullScreenSupported: () => true,
}));

// Giphy picker posts and attached Giphy media both open this popup.
const GIPHY_GIF =
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/88EhKlGzXuhBfStCds/giphy.gif?cid=790b7611&rid=giphy.gif&ct=g";
const GIPHY_DIRECTORY =
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/88EhKlGzXuhBfStCds/";
const CDN_GIF = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/large.gif";

const proxyUrl = (params: Record<string, string>) =>
  `/api/og-metadata/image?${new URLSearchParams(params).toString()}`;

const originalMatchMedia = globalThis.matchMedia;
let reduceMotion = false;
let paused = true;
const pause = jest.fn(() => {
  paused = true;
});
const videoFullscreen = jest.fn().mockResolvedValue(undefined);

const renderModal = (
  props: Partial<ComponentProps<typeof ImageMediaModal>> = {}
) => {
  const imageRef = createRef<HTMLImageElement>();
  const handlers = {
    onClose: jest.fn(),
    onDownload: jest.fn(),
    onFullscreen: jest.fn(),
  };
  const modal = (overrides: typeof props = {}) => (
    <ImageMediaModal
      src={GIPHY_GIF}
      imageRef={imageRef}
      isDownloading={false}
      {...handlers}
      {...props}
      {...overrides}
    />
  );
  const { rerender } = render(modal());
  return {
    imageRef,
    ...handlers,
    rerender: (overrides: typeof props) => rerender(modal(overrides)),
  };
};

const getVideo = (name = "Expanded GIF animation") =>
  screen.getByLabelText(name, { selector: "video" }) as HTMLVideoElement;
const queryVideo = () =>
  screen.queryByLabelText("Expanded GIF animation", { selector: "video" });

beforeEach(() => {
  reduceMotion = false;
  paused = true;
  pause.mockClear();
  videoFullscreen.mockClear();
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: jest.fn(async () => {
      paused = false;
    }),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: pause,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "paused", {
    configurable: true,
    get: () => paused,
  });
  Object.defineProperty(HTMLVideoElement.prototype, "requestFullscreen", {
    configurable: true,
    value: videoFullscreen,
  });
  globalThis.matchMedia = jest.fn((query: string) => ({
    matches: reduceMotion && query === "(prefers-reduced-motion: reduce)",
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof globalThis.matchMedia;
});

afterEach(() => {
  globalThis.matchMedia = originalMatchMedia;
});

describe("ImageMediaModal Giphy video", () => {
  it("plays the MP4 rendition through the proxy with a playback toggle", () => {
    renderModal();

    const video = getVideo();
    expect(video).toHaveAttribute(
      "src",
      proxyUrl({ url: `${GIPHY_DIRECTORY}giphy.mp4`, format: "mp4" })
    );
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video).toHaveAttribute("playsinline");
    // The animated re-encode is never requested.
    expect(screen.queryByAltText("Expanded image preview")).toBeNull();
    expect(document.querySelector('img[src*="animated=1"]')).toBeNull();

    // The control is the first toolbar button, always visible, never revealed
    // on hover, and clear of the gallery controls.
    const toggle = screen.getByRole("button", { name: "Play animation" });
    const toolbar = toggle.parentElement!;
    expect(within(toolbar).getAllByRole("button")[0]).toBe(toggle);
    expect(toolbar).toContainElement(
      screen.getByRole("button", { name: "View original" })
    );
    expect(toggle.className).not.toContain("tw-opacity-0");
    expect(toggle.className).not.toMatch(/tw-(fixed|absolute)/);

    fireEvent.loadedMetadata(video);
    paused = false;
    fireEvent.play(video);
    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));

    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("falls back to the existing GIF preview when the video fails", () => {
    renderModal();

    fireEvent.error(getVideo());

    expect(queryVideo()).toBeNull();
    expect(
      screen.queryByRole("button", { name: /animation/ })
    ).not.toBeInTheDocument();
    expect(screen.getByAltText("Expanded image preview")).toHaveAttribute(
      "src",
      proxyUrl({ url: GIPHY_GIF, animated: "1", w: "1200" })
    );
  });

  it("forgets the playing state on video error and tries the video again on retry", () => {
    renderModal();
    const video = getVideo();
    fireEvent.loadedMetadata(video);
    fireEvent.play(video);
    expect(
      screen.getByRole("button", { name: "Pause animation" })
    ).toBeInTheDocument();

    fireEvent.error(video);
    fireEvent.error(screen.getByAltText("Expanded image preview"));
    fireEvent.click(screen.getByRole("button", { name: "Retry preview" }));

    expect(getVideo()).not.toBe(video);
    expect(
      screen.getByRole("button", { name: "Play animation" })
    ).toBeInTheDocument();
  });

  it("shows the still with a Play control when reduced motion is preferred", () => {
    reduceMotion = true;
    renderModal();

    const video = getVideo();
    expect(video.autoplay).toBe(false);
    expect(video).toHaveAttribute(
      "poster",
      proxyUrl({ url: `${GIPHY_DIRECTORY}480w_s.jpg`, w: "800" })
    );
    fireEvent.loadedMetadata(video);
    expect(
      screen.getByRole("button", { name: "Play animation" })
    ).toBeInTheDocument();
  });

  it("offers full screen once the video loads and puts the video, not the caller's image target, in it", () => {
    const { onFullscreen } = renderModal();
    const video = getVideo();
    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();

    fireEvent.loadedMetadata(video);
    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));

    expect(videoFullscreen).toHaveBeenCalledTimes(1);
    expect(videoFullscreen.mock.contexts[0]).toBe(video);
    expect(onFullscreen).not.toHaveBeenCalled();
  });

  it("withdraws full screen while a retried video loads", () => {
    renderModal();
    fireEvent.loadedMetadata(getVideo());
    fireEvent.error(getVideo());
    fireEvent.error(screen.getByAltText("Expanded image preview"));
    fireEvent.click(screen.getByRole("button", { name: "Retry preview" }));

    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();
    fireEvent.loadedMetadata(getVideo());
    expect(
      screen.getByRole("button", { name: "Full screen" })
    ).toBeInTheDocument();
  });

  it("tries a failed video again after moving away and back in the gallery", () => {
    const { rerender } = renderModal();
    fireEvent.error(getVideo());
    expect(queryVideo()).toBeNull();

    rerender({ src: CDN_GIF });
    expect(queryVideo()).toBeNull();
    rerender({ src: GIPHY_GIF });

    expect(getVideo()).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Play animation" })
    ).toBeInTheDocument();
    expect(screen.queryByAltText("Expanded image preview")).toBeNull();
  });

  it("reaches the playback control in the toolbar's place in Tab order", async () => {
    const user = userEvent.setup();
    renderModal({
      onOpen: jest.fn(),
      openLabel: "Open in tab",
      gallery: {
        canGoNext: true,
        canGoPrevious: true,
        currentIndex: 1,
        onNext: jest.fn(),
        onPrevious: jest.fn(),
        total: 3,
      },
    });
    fireEvent.loadedMetadata(getVideo());

    const order: (string | null)[] = [];
    for (let step = 0; step < 10; step++) {
      await user.tab();
      order.push(document.activeElement!.getAttribute("aria-label"));
    }

    expect(order).toEqual([
      "Close modal",
      "Close modal",
      "Previous image",
      "Next image",
      "Play animation",
      "View original",
      "Full screen",
      "Open in tab",
      "Download media",
      "Close media",
    ]);
  });

  it("keeps the popup open for a click on the video and closes on keyboard activation", () => {
    const { onClose } = renderModal();
    const mediaButton = getVideo().closest("button")!;

    fireEvent.click(getVideo(), { detail: 1 });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(mediaButton, { detail: 0 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("names the video with a caller-supplied description", () => {
    renderModal({ videoAlt: "Dancing cat" });

    expect(getVideo("Dancing cat")).toBeInTheDocument();
  });

  it("keeps Open and Download on the original GIF actions", () => {
    const onOpen = jest.fn();
    const { onDownload } = renderModal({ onOpen, openLabel: "Open in tab" });

    fireEvent.click(screen.getByRole("button", { name: "Open in tab" }));
    fireEvent.click(screen.getByRole("button", { name: "Download media" }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("swaps the video for a requested original once it loads, and back", () => {
    const { imageRef } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "View original" }));

    const original = screen.getByAltText("Original GIF animation");
    expect(original).toHaveAttribute("src", GIPHY_GIF);
    expect(original).not.toBeVisible();
    expect(getVideo()).toBeVisible();

    fireEvent.load(original);
    expect(original).toBeVisible();
    expect(queryVideo()).toBeNull();
    expect(imageRef.current).toBe(original);
    expect(
      screen.queryByRole("button", { name: /animation/ })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View optimized" }));
    expect(getVideo()).toBeInTheDocument();
  });

  it("leaves other images on the optimized preview", () => {
    const { onFullscreen } = renderModal({ src: CDN_GIF });

    expect(queryVideo()).toBeNull();
    expect(
      screen.queryByRole("button", { name: /animation/ })
    ).not.toBeInTheDocument();
    expect(screen.getByAltText("Expanded image preview")).toHaveAttribute(
      "src",
      CDN_GIF.replace("large.gif", "AUTOx1080_gifv2/large.gif")
    );

    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(onFullscreen).toHaveBeenCalledTimes(1);
    expect(videoFullscreen).not.toHaveBeenCalled();
  });
});
