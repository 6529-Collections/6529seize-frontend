import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, forwardRef, type ComponentProps } from "react";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...rest }, ref) =>
      createElement("img", { ...rest, ref, alt: alt ?? "" })
  ),
}));

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ hasTouchScreen: false })),
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: () => [jest.fn(), true],
}));

// Giphy picker posts arrive as markdown images, rendered through this component.
const GIPHY_GIF =
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/88EhKlGzXuhBfStCds/giphy.gif?cid=790b7611&rid=giphy.gif&ct=g";
const GIPHY_DIRECTORY =
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/88EhKlGzXuhBfStCds/";

const proxyUrl = (params: Record<string, string>) =>
  `/api/og-metadata/image?${new URLSearchParams(params).toString()}`;

const originalMatchMedia = globalThis.matchMedia;
let reduceMotion = false;
let paused = true;
const pause = jest.fn(() => {
  paused = true;
});

const getVideo = () =>
  screen.getByLabelText("Animated GIF", {
    selector: "video",
  }) as HTMLVideoElement;

const renderMarkdownImage = (
  props: Partial<ComponentProps<typeof DropListItemContentMediaImage>> = {}
) =>
  render(
    <DropListItemContentMediaImage
      src={GIPHY_GIF}
      loadStrategy="eager"
      intrinsicHeight
      {...props}
    />
  );

beforeEach(() => {
  reduceMotion = false;
  paused = true;
  pause.mockClear();
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
  globalThis.matchMedia = jest.fn((query: string) => ({
    matches: reduceMotion && query === "(prefers-reduced-motion: reduce)",
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof globalThis.matchMedia;
  (globalThis as any).ResizeObserver = class {
    observe() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  };
});

afterEach(() => {
  globalThis.matchMedia = originalMatchMedia;
});

describe("DropListItemContentMediaImage Giphy video", () => {
  it("plays a markdown Giphy GIF from its MP4 rendition through the proxy", () => {
    renderMarkdownImage();

    const video = getVideo();
    expect(video).toHaveAttribute(
      "src",
      proxyUrl({ url: `${GIPHY_DIRECTORY}giphy.mp4`, format: "mp4" })
    );
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video).toHaveAttribute("playsinline");
    expect(screen.queryByAltText("Drop media")).toBeNull();
    // Hidden media may never autoplay; the video is visible before it loads.
    expect(video.closest("[data-drop-image-content]")).not.toHaveAttribute(
      "hidden"
    );
  });

  it("offers the media toolbar once the video loads and fullscreens the video", () => {
    const requestFullscreen = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
    renderMarkdownImage();
    expect(
      screen.queryByRole("button", { name: "Download media" })
    ).not.toBeInTheDocument();

    const video = getVideo();
    fireEvent.loadedMetadata(video);
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /full screen/i }));

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(requestFullscreen.mock.contexts[0]).toBe(video);
  });

  it("mounts the playback control with the video and pauses it", () => {
    renderMarkdownImage();
    const video = getVideo();
    expect(
      screen.getByRole("button", { name: "Play animation" })
    ).toBeInTheDocument();

    fireEvent.loadedMetadata(video);
    paused = false;
    fireEvent.play(video);
    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));

    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("shows the still with a Play control when reduced motion is preferred", () => {
    reduceMotion = true;
    renderMarkdownImage();

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

  it("names the video with a caller-supplied description", () => {
    renderMarkdownImage({ alt: "Dancing cat" });

    expect(
      screen.getByLabelText("Dancing cat", { selector: "video" })
    ).toBeInTheDocument();
  });

  it("forgets the playing state when a playing video fails", () => {
    renderMarkdownImage();
    const video = getVideo();
    fireEvent.loadedMetadata(video);
    fireEvent.play(video);
    expect(
      screen.getByRole("button", { name: "Pause animation" })
    ).toBeInTheDocument();

    fireEvent.error(video);
    fireEvent.error(screen.getByAltText("Drop media"));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      screen.getByRole("button", { name: "Play animation" })
    ).toBeInTheDocument();
  });

  it("falls back to the GIF preview when the video fails", () => {
    renderMarkdownImage();

    fireEvent.error(getVideo());

    expect(
      screen.queryByLabelText("Animated GIF", { selector: "video" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /animation/ })
    ).not.toBeInTheDocument();
    expect(screen.getByAltText("Drop media")).toBeInTheDocument();
  });

  it("keeps the GIF path for other hosts", () => {
    renderMarkdownImage({ src: "https://cdn.example.com/reaction.gif" });

    expect(
      screen.queryByLabelText("Animated GIF", { selector: "video" })
    ).toBeNull();
    expect(screen.getByAltText("Drop media")).toBeInTheDocument();
  });

  it("keeps the GIF path where no playback control can be shown", () => {
    renderMarkdownImage({ disableModal: true });

    expect(
      screen.queryByLabelText("Animated GIF", { selector: "video" })
    ).toBeNull();
    expect(screen.getByAltText("Drop media")).toBeInTheDocument();
  });
});
