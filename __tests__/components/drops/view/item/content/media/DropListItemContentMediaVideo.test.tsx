import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";

const downloadMediaUrlMock = jest.fn();
const playMock = jest.fn().mockResolvedValue(undefined);
const pauseMock = jest.fn();
const loadMock = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: false }));
jest.mock("@/hooks/useInView", () => ({ useInView: jest.fn() }));
jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: jest.fn(),
}));
jest.mock("@/helpers/media-download.helpers", () => ({
  __esModule: true,
  getDownloadFilenameFromUrl: jest.fn((_url: string) => "foo.mp4"),
  downloadMediaUrl: (...args: unknown[]) => downloadMediaUrlMock(...args),
  triggerDirectDownload: jest.fn(),
}));

const mockUseInView = require("@/hooks/useInView").useInView as jest.Mock;
const mockUseOptimizedVideo = require("@/hooks/useOptimizedVideo")
  .useOptimizedVideo as jest.Mock;

describe("DropListItemContentMediaVideo", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: playMock,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: pauseMock,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value: loadMock,
    });
    Object.defineProperty(document.body, "requestFullscreen", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    downloadMediaUrlMock.mockClear();
    playMock.mockClear();
    pauseMock.mockClear();
    loadMock.mockClear();
    setReducedMotion(false);
  });

  function setReducedMotion(matches: boolean) {
    const matchMediaMock = jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    const existingMatchMedia = globalThis.matchMedia;

    if (jest.isMockFunction(existingMatchMedia)) {
      existingMatchMedia.mockImplementation(matchMediaMock);
      return;
    }

    (
      globalThis as typeof globalThis & {
        matchMedia: typeof matchMediaMock;
      }
    ).matchMedia = matchMediaMock;
  }

  function setup({
    inView = true,
    src = "foo.mp4",
    mimeType,
    fallbackSrc,
    disableAutoPlay = false,
  }: {
    readonly inView?: boolean | undefined;
    readonly src?: string | undefined;
    readonly mimeType?: string | undefined;
    readonly fallbackSrc?: string | undefined;
    readonly disableAutoPlay?: boolean | undefined;
  } = {}) {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, inView]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: src,
      isHls: false,
    });

    return render(
      <DropListItemContentMediaVideo
        src={src}
        mimeType={mimeType}
        fallbackSrc={fallbackSrc}
        disableAutoPlay={disableAutoPlay}
      />
    );
  }

  it("renders custom video controls instead of native browser controls", () => {
    setup();
    expect(
      screen.getByText("Your browser does not support the video tag.")
    ).toBeInTheDocument();
    const vid = document.querySelector("video") as HTMLVideoElement;
    expect(vid).toBeTruthy();
    expect(vid.autoplay).toBe(false); // Component uses useEffect for controlled playback
    expect(vid.controls).toBe(false);
    expect(
      screen.queryByRole("button", { name: "Play video" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pause video" })
    ).not.toBeInTheDocument();
    expect(vid).toHaveAttribute(
      "aria-label",
      "Video. Press Enter or Space to play or pause."
    );
    expect(
      screen.getByRole("button", { name: "Unmute video" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Video progress" })
    ).toBeInTheDocument();
  });

  it("renders video even when not in view (but paused)", () => {
    setup({ inView: false });
    expect(document.querySelector("video")).toBeTruthy(); // Video is still rendered, just paused
    expect(pauseMock).toHaveBeenCalled();
  });

  it("does not autoplay when disableAutoPlay is true", () => {
    setup({ disableAutoPlay: true });
    expect(playMock).not.toHaveBeenCalled();
  });

  it("does not autoplay when reduced motion is preferred", () => {
    setReducedMotion(true);

    setup();

    expect(playMock).not.toHaveBeenCalled();
    expect(pauseMock).toHaveBeenCalled();
  });

  it("toggles playback from the video surface", async () => {
    setup({ disableAutoPlay: true });
    const video = screen.getByLabelText(
      "Video. Press Enter or Space to play or pause."
    );

    fireEvent.click(video);

    await act(async () => {
      await Promise.resolve();
    });

    expect(playMock).toHaveBeenCalled();
  });

  it("toggles playback from keyboard on the video surface", async () => {
    setup({ disableAutoPlay: true });
    const video = screen.getByLabelText(
      "Video. Press Enter or Space to play or pause."
    );

    fireEvent.keyDown(video, { key: "Enter" });

    await act(async () => {
      await Promise.resolve();
    });

    expect(playMock).toHaveBeenCalled();
  });

  it("toggles mute from the custom mute button", () => {
    setup({ disableAutoPlay: true });
    const video = document.querySelector("video") as HTMLVideoElement;

    fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));

    expect(video.muted).toBe(false);
    expect(
      screen.getByRole("button", { name: "Mute video" })
    ).toBeInTheDocument();
  });

  it("seeks from the custom progress control", () => {
    setup({ disableAutoPlay: true });
    const video = document.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", {
      configurable: true,
      value: 22,
    });
    fireEvent.loadedMetadata(video);

    fireEvent.change(screen.getByRole("slider", { name: "Video progress" }), {
      target: { value: "12" },
    });

    expect(video.currentTime).toBe(12);
  });

  it("shows a persistent bottom progress strip without timestamps", () => {
    setup({ disableAutoPlay: true });
    const video = document.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", {
      configurable: true,
      value: 22,
    });
    fireEvent.loadedMetadata(video);

    const progressControl = screen.getByRole("slider", {
      name: "Video progress",
    });

    expect(screen.queryByText("0:00 / 0:22")).not.toBeInTheDocument();
    expect(progressControl.parentElement?.className).toContain("tw-bottom-0");
    expect(progressControl.parentElement?.className).not.toContain(
      "tw-opacity-0"
    );
  });

  it("keeps progress value in range before metadata loads", () => {
    setup({ disableAutoPlay: true });

    expect(screen.getByRole("slider", { name: "Video progress" })).toHaveValue(
      "0"
    );
  });

  it("falls back to the original video source when the current source errors", () => {
    setup({
      src: "https://example.com/compressed.mp4",
      fallbackSrc: "https://example.com/original.mov",
      disableAutoPlay: true,
    });
    const video = document.querySelector("video") as HTMLVideoElement;

    fireEvent.error(video);

    expect(video.src).toBe("https://example.com/original.mov");
    expect(loadMock).toHaveBeenCalled();
  });

  it("always shows the inline video media actions", () => {
    const { container } = setup();

    expect(container.querySelector("video")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Full screen" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open in new tab" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("keeps player chrome hidden until hover or focus", () => {
    setup({ disableAutoPlay: true });

    expect(
      screen.getByRole("button", { name: "Unmute video" }).className
    ).toContain("tw-left-3");
    expect(
      screen.getByRole("button", { name: "Unmute video" }).className
    ).toContain("tw-bottom-5");
    expect(
      screen.getByRole("button", { name: "Unmute video" }).className
    ).toContain("tw-opacity-0");
    expect(
      screen.getByRole("button", { name: "Full screen" }).parentElement
        ?.className
    ).toContain("tw-opacity-0");
  });

  it("wires the mute button to become visible in custom fullscreen", () => {
    setup({ disableAutoPlay: true });

    const muteButton = screen.getByRole("button", { name: "Unmute video" });
    const fullscreenTarget = document.querySelector("video")?.parentElement;

    expect(muteButton.className).toContain("tw-opacity-0");
    expect(muteButton.className).toContain("drop-video-sound-button");
    expect(fullscreenTarget?.className).toContain(
      "[&:fullscreen_.drop-video-sound-button]:tw-opacity-100"
    );
  });

  it("hides open action for QuickTime video that browsers download directly", () => {
    setup({ src: "foo.mov" });

    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("hides open action for video/quicktime even without a mov extension", () => {
    setup({ src: "foo", mimeType: "video/quicktime" });

    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("hides open action for video/quicktime with MIME parameters", () => {
    setup({ src: "foo", mimeType: "video/quicktime; codecs=avc1" });

    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("downloads the original video source from the custom button", async () => {
    setup({ src: "https://example.com/path/foo.mp4" });

    fireEvent.click(screen.getByRole("button", { name: "Download media" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(downloadMediaUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/path/foo.mp4",
        fileName: "foo.mp4",
        isCapacitor: false,
        dialogTitle: "Save video",
      })
    );
  });
});
