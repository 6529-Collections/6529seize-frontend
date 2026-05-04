import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaDisplayVideo from "@/components/drops/view/item/content/media/MediaDisplayVideo";

// mock hooks used inside component
jest.mock("@/hooks/useInView", () => ({
  useInView: () => [jest.fn(), true],
}));

const playMock = jest.fn().mockResolvedValue(undefined);
const pauseMock = jest.fn();
const downloadMock = jest.fn();

jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: jest.fn(() => ({
    playableUrl: "video.mp4",
    isHls: false,
  })),
}));

const mockUseOptimizedVideo = require("@/hooks/useOptimizedVideo")
  .useOptimizedVideo as jest.Mock;

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: () => ({ download: downloadMock }),
}));

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: playMock,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: pauseMock,
  });
});

beforeEach(() => {
  jest.useRealTimers();
  playMock.mockClear();
  pauseMock.mockClear();
  downloadMock.mockClear();
});

describe("MediaDisplayVideo", () => {
  it("uses controlled playback instead of autoplay attribute", () => {
    const { container } = render(<MediaDisplayVideo src="foo.mp4" />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.autoplay).toBe(false); // Component uses useEffect for controlled playback
  });

  it("keeps preferring HLS renditions when native controls are shown", () => {
    render(<MediaDisplayVideo src="foo.mp4" showControls />);
    expect(mockUseOptimizedVideo).toHaveBeenCalledWith(
      "foo.mp4",
      expect.objectContaining({ preferHls: true })
    );
  });

  it("does not render the custom download button when controls are hidden", () => {
    render(<MediaDisplayVideo src="foo.mp4" />);
    expect(
      screen.queryByRole("button", { name: /download video/i })
    ).toBeNull();
  });

  it("shows the custom download button on activity and hides it after idle", () => {
    jest.useFakeTimers();
    const { container } = render(
      <MediaDisplayVideo src="foo.mp4" showControls />
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

  it("downloads the original video source from the custom button", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MediaDisplayVideo src="https://example.com/path/foo.mp4" showControls />
    );
    fireEvent.mouseMove(container.firstElementChild as HTMLElement);

    await user.click(screen.getByRole("button", { name: /download video/i }));

    expect(downloadMock).toHaveBeenCalledWith(
      "https://example.com/path/foo.mp4",
      "foo.mp4"
    );
  });

  it("toggles play state on click when controls hidden", async () => {
    const user = userEvent.setup();
    const { container } = render(<MediaDisplayVideo src="foo.mp4" />);
    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "paused", { writable: true, value: true });
    await user.click(video);
    expect(playMock).toHaveBeenCalled();
    (video as any).paused = false;
    await user.click(video);
    expect(pauseMock).toHaveBeenCalled();
  });
});
