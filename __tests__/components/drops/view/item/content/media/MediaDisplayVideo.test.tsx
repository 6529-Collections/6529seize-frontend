import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaDisplayVideo from "@/components/drops/view/item/content/media/MediaDisplayVideo";

// mock hooks used inside component
jest.mock("@/hooks/useInView", () => ({
  useInView: jest.fn(() => [jest.fn(), true]),
}));

const playMock = jest.fn().mockResolvedValue(undefined);
const pauseMock = jest.fn();
const downloadMediaUrlMock = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: false }));
jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: jest.fn(() => ({
    playableUrl: "video.mp4",
    isHls: false,
  })),
}));

const mockUseOptimizedVideo = require("@/hooks/useOptimizedVideo")
  .useOptimizedVideo as jest.Mock;
const mockUseInView = require("@/hooks/useInView").useInView as jest.Mock;

jest.mock("@/helpers/media-download.helpers", () => ({
  __esModule: true,
  getDownloadFilenameFromUrl: jest.fn((_url: string) => "foo.mp4"),
  downloadMediaUrl: (...args: unknown[]) => downloadMediaUrlMock(...args),
  triggerDirectDownload: jest.fn(),
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
  mockUseInView.mockReturnValue([jest.fn(), true]);
  playMock.mockClear();
  pauseMock.mockClear();
  downloadMediaUrlMock.mockClear();
});

describe("MediaDisplayVideo", () => {
  it("uses controlled playback instead of autoplay attribute", () => {
    const { container } = render(<MediaDisplayVideo src="foo.mp4" />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.autoplay).toBe(false); // Component uses useEffect for controlled playback
  });

  it("keeps preferring HLS renditions when native controls are shown", () => {
    render(<MediaDisplayVideo src="foo.mp4" showControls />);
    expect(mockUseInView).toHaveBeenCalledWith(
      expect.objectContaining({
        freezeOnceVisible: false,
        rootMargin: "400px 0px",
        threshold: 0.1,
      })
    );
    expect(mockUseOptimizedVideo).toHaveBeenCalledWith(
      "foo.mp4",
      expect.objectContaining({ enabled: true, preferHls: true })
    );
  });

  it("keeps video optimization disabled until the wrapper is in view", () => {
    mockUseInView.mockReturnValue([jest.fn(), false]);

    render(<MediaDisplayVideo src="foo.mp4" showControls />);

    expect(mockUseOptimizedVideo).toHaveBeenCalledWith(
      "foo.mp4",
      expect.objectContaining({ enabled: false })
    );
  });

  it("does not render the custom download button when controls are hidden", () => {
    render(<MediaDisplayVideo src="foo.mp4" />);
    expect(
      screen.queryByRole("button", { name: /download video/i })
    ).toBeNull();
  });

  it("always shows inline video media actions when controls are shown", () => {
    render(<MediaDisplayVideo src="foo.mp4" showControls />);

    expect(
      screen.getByRole("button", { name: "Open in new tab" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
  });

  it("fills a reserved media container when requested", () => {
    const { container } = render(
      <MediaDisplayVideo src="foo.mp4" fillContainer />
    );

    const wrapper = container.firstElementChild;
    const video = container.querySelector("video");

    expect(wrapper).toHaveClass("tw-h-full", "tw-max-h-full");
    expect(video?.parentElement).toHaveClass(
      "tw-flex",
      "tw-items-center",
      "tw-justify-center"
    );
  });

  it("downloads the original video source from the custom button", async () => {
    const user = userEvent.setup();
    render(
      <MediaDisplayVideo src="https://example.com/path/foo.mp4" showControls />
    );

    await user.click(screen.getByRole("button", { name: "Download media" }));

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

  it("pauses ambient video clicks without starting paused videos", async () => {
    const user = userEvent.setup();
    const { container } = render(<MediaDisplayVideo src="foo.mp4" />);
    const video = container.querySelector("video") as HTMLVideoElement;
    let paused = false;
    Object.defineProperty(video, "paused", {
      configurable: true,
      get: () => paused,
    });

    const playCallsBeforeClick = playMock.mock.calls.length;
    const pauseCallsBeforeClick = pauseMock.mock.calls.length;

    await user.click(video);
    expect(playMock).toHaveBeenCalledTimes(playCallsBeforeClick);
    expect(pauseMock).toHaveBeenCalledTimes(pauseCallsBeforeClick + 1);

    paused = true;
    await user.click(video);
    expect(playMock).toHaveBeenCalledTimes(playCallsBeforeClick);
    expect(pauseMock).toHaveBeenCalledTimes(pauseCallsBeforeClick + 1);
  });
});
