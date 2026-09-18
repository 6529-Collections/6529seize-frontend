import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";

const downloadMediaUrlMock = jest.fn();
let mockIsApp = false;

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: mockIsApp }));
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

function mockPrefersReducedMotion(matches: boolean) {
  jest.spyOn(globalThis, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        addEventListener: jest.fn(),
        addListener: jest.fn(),
        dispatchEvent: jest.fn(),
        matches,
        media: query,
        onchange: null,
        removeEventListener: jest.fn(),
        removeListener: jest.fn(),
      }) as MediaQueryList
  );
}

describe("DropListItemContentMediaVideo", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
    mockIsApp = false;
    downloadMediaUrlMock.mockClear();
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders video when in view", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    // Mock HTMLVideoElement.play to return a promise
    const playSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: playSpy,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);
    expect(
      screen.getByText("Your browser does not support the video tag.")
    ).toBeInTheDocument();
    const vid = document.querySelector("video") as HTMLVideoElement;
    expect(vid).toBeTruthy();
    expect(vid.autoplay).toBe(false); // Ambient playback is managed imperatively.
    expect(playSpy).toHaveBeenCalled();
    expect(mockUseInView).toHaveBeenCalledWith(
      expect.objectContaining({
        freezeOnceVisible: false,
        rootMargin: "400px 0px",
        threshold: 0.1,
      })
    );
    expect(mockUseOptimizedVideo).toHaveBeenCalledWith(
      "foo.mp4",
      expect.objectContaining({ enabled: true })
    );
  });

  it("centers the natural video player when requested", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" align="center" />);

    expect(
      screen.getByLabelText("Video player").parentElement?.parentElement
    ).toHaveClass("tw-mx-auto");
  });

  it("keeps video optimization disabled until the wrapper is in view", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, false]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);
    expect(document.querySelector("video")).toBeTruthy();
    expect(mockUseOptimizedVideo).toHaveBeenCalledWith(
      "foo.mp4",
      expect.objectContaining({ enabled: false })
    );
  });

  it("does not autoplay when disableAutoPlay is true", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const playSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: playSpy,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" disableAutoPlay />);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "autoplays an opted-in app video with artworkLayout=%s",
    (artworkLayout) => {
      mockIsApp = true;
      mockPrefersReducedMotion(false);
      const ref = {
        current: document.createElement("div"),
      } as React.RefObject<HTMLDivElement>;
      mockUseInView.mockReturnValue([ref, true]);
      mockUseOptimizedVideo.mockReturnValue({
        playableUrl: "foo.mp4",
        isHls: false,
      });

      const playSpy = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(HTMLVideoElement.prototype, "play", {
        configurable: true,
        writable: true,
        value: playSpy,
      });

      render(
        <DropListItemContentMediaVideo
          src="foo.mp4"
          allowAutoPlayInApp
          artworkLayout={artworkLayout}
        />
      );

      expect(playSpy).toHaveBeenCalled();
      const frame =
        screen.getByLabelText("Video player").parentElement?.parentElement;
      if (artworkLayout) {
        expect(frame).toHaveClass("artwork");
      } else {
        expect(frame).toHaveClass("tw-w-full");
        expect(frame).not.toHaveClass("artwork");
      }
      expect(
        screen.getByRole("slider", { name: "Seek video" })
      ).toBeInTheDocument();
    }
  );

  it("does not autoplay an opted-in app video when reduced motion is on", () => {
    mockIsApp = true;
    mockPrefersReducedMotion(true);
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const playSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: playSpy,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" allowAutoPlayInApp />);

    expect(playSpy).not.toHaveBeenCalled();
  });

  it("starts an opted-in app video when it enters view after setup", () => {
    mockIsApp = true;
    mockPrefersReducedMotion(false);
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    let setInView: React.Dispatch<React.SetStateAction<boolean>> | undefined;
    mockUseInView.mockImplementation(() => {
      const [inView, setCurrentInView] = React.useState(false);
      setInView = setCurrentInView;
      return [ref, inView];
    });
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const playSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: playSpy,
    });

    render(
      <DropListItemContentMediaVideo
        src="foo.mp4"
        allowAutoPlayInApp
        loadStrategy="eager"
      />
    );
    expect(playSpy).not.toHaveBeenCalled();

    act(() => {
      setInView?.(true);
    });

    expect(playSpy).toHaveBeenCalled();
  });

  it("does not pause while its video is in wrapper fullscreen", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, false]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const pauseSpy = jest.fn();
    Object.defineProperty(HTMLVideoElement.prototype, "pause", {
      configurable: true,
      writable: true,
      value: pauseSpy,
    });

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: document.body,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);

    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("pauses an app video after its wrapper fullscreen exits", () => {
    mockIsApp = true;
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, false]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const pauseSpy = jest.fn();
    Object.defineProperty(HTMLVideoElement.prototype, "pause", {
      configurable: true,
      writable: true,
      value: pauseSpy,
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: document.body,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
    document.dispatchEvent(new Event("fullscreenchange"));

    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it("always shows the inline video media actions", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const { container } = render(
      <DropListItemContentMediaVideo src="foo.mp4" />
    );

    expect(container.querySelector("video")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Open in new tab" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("hides open action for QuickTime video that browsers download directly", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mov",
      isHls: false,
    });

    render(<DropListItemContentMediaVideo src="foo.mov" />);

    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("hides open action for video/quicktime even without a mov extension", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo",
      isHls: false,
    });

    render(
      <DropListItemContentMediaVideo src="foo" mimeType="video/quicktime" />
    );

    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("hides open action for video/quicktime with MIME parameters", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo",
      isHls: false,
    });

    render(
      <DropListItemContentMediaVideo
        src="foo"
        mimeType="video/quicktime; codecs=avc1"
      />
    );

    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("downloads the original video source from the custom button", async () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    render(
      <DropListItemContentMediaVideo src="https://example.com/path/foo.mp4" />
    );

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

  it("pauses video-surface clicks without starting paused videos", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const playSpy = jest.fn().mockResolvedValue(undefined);
    const pauseSpy = jest.fn();
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: playSpy,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "pause", {
      configurable: true,
      writable: true,
      value: pauseSpy,
    });

    const { container } = render(
      <DropListItemContentMediaVideo src="foo.mp4" />
    );
    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }

    let paused = false;
    Object.defineProperty(video, "paused", {
      configurable: true,
      get: () => paused,
    });

    const playCallsBeforeClick = playSpy.mock.calls.length;
    const pauseCallsBeforeClick = pauseSpy.mock.calls.length;

    fireEvent.click(video);

    expect(pauseSpy).toHaveBeenCalledTimes(pauseCallsBeforeClick + 1);
    expect(playSpy).toHaveBeenCalledTimes(playCallsBeforeClick);

    paused = true;
    fireEvent.click(video);

    expect(pauseSpy).toHaveBeenCalledTimes(pauseCallsBeforeClick + 1);
    expect(playSpy).toHaveBeenCalledTimes(playCallsBeforeClick);
  });

  it("shows a retry action after a terminal playback error", () => {
    jest.useFakeTimers();
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const { container } = render(
      <DropListItemContentMediaVideo src="foo.mp4" />
    );
    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }
    Object.defineProperty(video, "error", {
      configurable: true,
      value: { code: 4 },
    });

    fireEvent.error(video);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Couldn’t load video.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByText("Couldn’t load video.")).not.toBeInTheDocument();
  });

  it("keeps a recoverable playback error hidden during the recovery grace period", () => {
    jest.useFakeTimers();
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "stream.m3u8",
      isHls: true,
    });

    const { container } = render(
      <DropListItemContentMediaVideo src="stream.mp4" />
    );
    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }
    let playbackError: Pick<MediaError, "code"> | null = { code: 3 };
    Object.defineProperty(video, "error", {
      configurable: true,
      get: () => playbackError,
    });

    fireEvent.error(video);
    playbackError = null;
    fireEvent.loadedData(video);
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Couldn’t load video.")).not.toBeInTheDocument();
  });
});
