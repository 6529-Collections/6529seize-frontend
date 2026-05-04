import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";

const downloadMock = jest.fn();

jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: false }));
jest.mock("@/hooks/useInView", () => ({ useInView: jest.fn() }));
jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: jest.fn(),
}));
jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: () => ({ download: downloadMock }),
}));

const mockUseInView = require("@/hooks/useInView").useInView as jest.Mock;
const mockUseOptimizedVideo = require("@/hooks/useOptimizedVideo")
  .useOptimizedVideo as jest.Mock;

describe("DropListItemContentMediaVideo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    downloadMock.mockClear();
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
      writable: true,
      value: playSpy,
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" disableAutoPlay />);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("shows the custom download button on activity and hides it after idle", () => {
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
    const wrapper = container.firstElementChild as HTMLElement;

    fireEvent.mouseMove(wrapper);
    const button = screen.getByRole("button", { name: /download video/i });
    expect(button).toHaveClass("tw-opacity-100");

    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(button).toHaveClass("tw-opacity-0");
  });

  it("downloads the original video source from the custom button", () => {
    const ref = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({
      playableUrl: "foo.mp4",
      isHls: false,
    });

    const { container } = render(
      <DropListItemContentMediaVideo src="https://example.com/path/foo.mp4" />
    );

    fireEvent.mouseMove(container.firstElementChild as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: /download video/i }));

    expect(downloadMock).toHaveBeenCalledWith(
      "https://example.com/path/foo.mp4",
      "foo.mp4"
    );
  });
});
