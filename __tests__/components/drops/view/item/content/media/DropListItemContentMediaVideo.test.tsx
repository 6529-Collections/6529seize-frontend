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

describe("DropListItemContentMediaVideo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockIsApp = false;
    downloadMediaUrlMock.mockClear();
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
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
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);
    expect(
      screen.getByText("Your browser does not support the video tag.")
    ).toBeInTheDocument();
    const vid = document.querySelector("video") as HTMLVideoElement;
    expect(vid).toBeTruthy();
    expect(vid.autoplay).toBe(false); // Component uses useEffect for controlled playback
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

    expect(screen.getByLabelText("Video player").parentElement).toHaveClass(
      "tw-mx-auto"
    );
  });

  it("renders video even when not in view (but paused)", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, false]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);
    expect(document.querySelector("video")).toBeTruthy(); // Video is still rendered, just paused
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
});
