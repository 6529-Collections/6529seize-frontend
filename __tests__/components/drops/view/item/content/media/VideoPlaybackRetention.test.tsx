import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import * as touchFirst from "@/helpers/touch-first.helpers";
import * as config from "@/components/drops/view/item/content/media/SeizeVideoPlayer.config";
import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";
import MediaDisplayVideo from "@/components/drops/view/item/content/media/MediaDisplayVideo";
import { ChatVideoPlaybackProvider } from "@/components/drops/view/item/content/media/ChatVideoPlayback";
import VirtualScrollWrapper from "@/components/waves/drops/VirtualScrollWrapper";
import { DropSize } from "@/helpers/waves/drop.helpers";

let mockInView = true;
let mockIsApp = true;
let mockSetInView: React.Dispatch<React.SetStateAction<boolean>>;
const mockFetchAround = jest.fn();
const mockVisibilityListeners = new Set<() => void>();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ fetchAroundSerialNo: mockFetchAround }),
}));
jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: mockIsApp }));
jest.mock("@/hooks/useInView", () => ({
  useInView: () => {
    const [inView, setInView] = React.useState(true);
    mockSetInView = setInView;
    return [{ current: null }, inView];
  },
}));
jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: jest.fn((src: string) => ({
    playableUrl: src,
    isHls: false,
  })),
}));

describe("video playback across DM virtualization", () => {
  let changeVisibility: IntersectionObserverCallback;
  const observerDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "IntersectionObserver"
  );

  beforeEach(() => {
    mockInView = true;
    mockIsApp = true;
    jest.spyOn(config, "useElementInView").mockImplementation(() =>
      React.useSyncExternalStore(
        (notify) => {
          mockVisibilityListeners.add(notify);
          return () => {
            mockVisibilityListeners.delete(notify);
          };
        },
        () => mockInView,
        () => false
      )
    );
    jest.spyOn(touchFirst, "isTouchFirstEnvironment").mockReturnValue(true);
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: class {
        constructor(callback: IntersectionObserverCallback) {
          changeVisibility = callback;
        }
        observe = jest.fn();
        unobserve = jest.fn();
        disconnect = jest.fn();
      },
    });
    jest.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(function (
      this: HTMLMediaElement
    ) {
      this.currentTime = 0;
      Object.defineProperty(this, "readyState", {
        configurable: true,
        value: 0,
      });
      Object.defineProperty(this, "duration", {
        configurable: true,
        value: Number.NaN,
      });
      this.dispatchEvent(new Event("emptied"));
      // Model a media engine resetting preferences while a source is loading.
      this.muted = true;
      this.volume = 1;
      this.dispatchEvent(new Event("volumechange"));
    });
    jest
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          value: true,
        });
        this.dispatchEvent(new Event("pause"));
      });
    jest.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
      this: HTMLMediaElement
    ) {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: false,
      });
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (observerDescriptor)
      Object.defineProperty(
        globalThis,
        "IntersectionObserver",
        observerDescriptor
      );
    else Reflect.deleteProperty(globalThis, "IntersectionObserver");
  });

  function metadata(video: HTMLVideoElement) {
    Object.defineProperty(video, "readyState", {
      configurable: true,
      value: 1,
    });
    Object.defineProperty(video, "duration", {
      configurable: true,
      value: 1200,
    });
    fireEvent.loadedMetadata(video);
    // Seeking a real media timeline emits seeked after restoration.
    fireEvent.seeked(video);
  }

  function dropContent(src = "long.mp4", waveId = "wave", dropSerialNo = 1) {
    return (
      <ChatVideoPlaybackProvider>
        <VirtualScrollWrapper
          scrollContainerRef={{ current: null }}
          dropSerialNo={dropSerialNo}
          waveId={waveId}
          type={DropSize.FULL}
        >
          <DropListItemContentMediaVideo src={src} />
        </VirtualScrollWrapper>
      </ChatVideoPlaybackProvider>
    );
  }

  function renderDrop() {
    return render(dropContent());
  }

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    "preserves eight minutes and unmuted audio through removal (native=%s, manuallyPaused=%s)",
    (native, manuallyPaused) => {
      mockIsApp = native;
      jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(native);
      const { container } = renderDrop();
      const video = screen.getByLabelText<HTMLVideoElement>("Video player");
      fireEvent.click(
        screen.getAllByRole("button", { name: "Play video" })[0]!
      );
      metadata(video);
      if (!video.paused)
        fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
      fireEvent.click(
        screen.getAllByRole("button", { name: "Play video" })[0]!
      );
      video.currentTime = 480;
      fireEvent.seeked(video);
      fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));
      video.volume = 0.6;
      fireEvent.volumeChange(video);
      expect(video.muted).toBe(false);
      if (manuallyPaused)
        fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
      jest
        .spyOn(container.firstElementChild!, "getBoundingClientRect")
        .mockReturnValue({ height: 400 } as DOMRect);
      act(() =>
        changeVisibility(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        )
      );
      expect(screen.queryByLabelText("Video player")).toBeNull();
      act(() =>
        changeVisibility(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        )
      );
      const recreated = screen.getByLabelText<HTMLVideoElement>("Video player");
      expect(recreated).not.toBe(video);
      // A quick Play/Pause before metadata must not save loading-time defaults.
      fireEvent.click(
        screen.getAllByRole("button", { name: "Play video" })[0]!
      );
      fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
      metadata(recreated);
      expect(recreated.currentTime).toBe(480);
      expect(screen.getByRole("slider", { name: "Seek video" })).toHaveValue(
        "40"
      );
      expect(recreated.muted).toBe(false);
      expect(recreated.volume).toBe(0.6);
      expect(recreated.paused).toBe(true);
      fireEvent.click(
        screen.getAllByRole("button", { name: "Play video" })[0]!
      );
      expect(recreated.currentTime).toBe(480);
      expect(recreated.muted).toBe(false);
      expect(recreated.paused).toBe(false);
    }
  );

  it("keeps audio and position when only the media visibility changes", () => {
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    render(<DropListItemContentMediaVideo src="long.mp4" />);
    const video = screen.getByLabelText<HTMLVideoElement>("Video player");
    metadata(video);
    fireEvent.click(screen.getAllByRole("button", { name: "Play video" })[0]!);
    video.currentTime = 480;
    fireEvent.seeked(video);
    fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
    mockInView = false;
    act(() => mockSetInView(false));
    expect(video).not.toHaveAttribute("src");
    mockInView = true;
    act(() => mockSetInView(true));
    metadata(video);
    expect(video.currentTime).toBe(480);
    expect(video.muted).toBe(false);
    expect(video.paused).toBe(true);
  });

  it("does not carry one video's position or mute choice into a different source", () => {
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const { rerender } = render(dropContent());
    const video = screen.getByLabelText<HTMLVideoElement>("Video player");
    fireEvent.click(screen.getAllByRole("button", { name: "Play video" })[0]!);
    metadata(video);
    video.currentTime = 480;
    fireEvent.seeked(video);
    fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));
    rerender(dropContent("other.mp4"));
    const other = screen.getByLabelText<HTMLVideoElement>("Video player");
    expect(other).not.toBe(video);
    fireEvent.click(screen.getAllByRole("button", { name: "Play video" })[0]!);
    metadata(other);
    expect(other.currentTime).toBe(0);
    expect(other.muted).toBe(true);
    rerender(dropContent());
    const restored = screen.getByLabelText<HTMLVideoElement>("Video player");
    fireEvent.click(screen.getAllByRole("button", { name: "Play video" })[0]!);
    metadata(restored);
    expect(restored.currentTime).toBe(480);
    expect(restored.muted).toBe(false);
  });

  it("clears remembered playback when the chat wrapper is removed", () => {
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const { unmount } = renderDrop();
    const video = screen.getByLabelText<HTMLVideoElement>("Video player");
    fireEvent.click(screen.getAllByRole("button", { name: "Play video" })[0]!);
    metadata(video);
    video.currentTime = 480;
    fireEvent.seeked(video);
    fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));
    unmount();
    renderDrop();
    const fresh = screen.getByLabelText<HTMLVideoElement>("Video player");
    metadata(fresh);
    expect(fresh.currentTime).toBe(0);
    expect(fresh.muted).toBe(true);
  });

  it.each([
    ["wave", 2],
    ["other-wave", 1],
  ])(
    "does not share playback for the same source in %s/drop %s",
    (waveId, serialNo) => {
      const { rerender } = render(dropContent());
      const original = screen.getByLabelText<HTMLVideoElement>("Video player");
      fireEvent.click(
        screen.getAllByRole("button", { name: "Play video" })[0]!
      );
      metadata(original);
      original.currentTime = 480;
      fireEvent.seeked(original);
      fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));

      rerender(dropContent("long.mp4", waveId, serialNo));
      const fresh = screen.getByLabelText<HTMLVideoElement>("Video player");
      expect(fresh).not.toBe(original);
      expect(fresh).not.toHaveAttribute("src");
      expect(fresh.paused).toBe(true);
      fireEvent.click(
        screen.getAllByRole("button", { name: "Play video" })[0]!
      );
      metadata(fresh);
      expect(fresh.currentTime).toBe(0);
      expect(fresh.muted).toBe(true);
    }
  );

  function chatVideos() {
    return (
      <ChatVideoPlaybackProvider>
        <div data-testid="first-video">
          <DropListItemContentMediaVideo src="first.mp4" />
        </div>
        <div data-testid="second-video">
          <MediaDisplayVideo src="second.mp4" />
        </div>
        <div data-testid="third-video">
          <DropListItemContentMediaVideo src="third.mp4" />
        </div>
      </ChatVideoPlaybackProvider>
    );
  }

  function playChatVideo(name: string) {
    fireEvent.click(
      within(screen.getByTestId(name)).getAllByRole("button", {
        name: "Play video",
      })[0]!
    );
  }

  it.each(["desktop", "mobile-browser", "native"])(
    "requires Play for each chat source and plays only one at a time (%s)",
    (environment) => {
      mockIsApp = environment === "native";
      jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(mockIsApp);
      jest
        .spyOn(touchFirst, "isTouchFirstEnvironment")
        .mockReturnValue(environment !== "desktop");
      render(chatVideos());
      const videos = screen.getAllByLabelText<HTMLVideoElement>("Video player");
      for (const video of videos) {
        expect(video).not.toHaveAttribute("src");
        expect(video).toHaveAttribute("preload", "none");
        expect(video.autoplay).toBe(false);
      }
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
      playChatVideo("first-video");
      expect(videos[0]).toHaveAttribute(
        "src",
        expect.stringContaining("first.mp4")
      );
      expect(videos[0]!.paused).toBe(false);
      metadata(videos[0]!);
      videos[0]!.currentTime = 480;
      fireEvent.seeked(videos[0]!);
      fireEvent.click(
        within(screen.getByTestId("first-video")).getByRole("button", {
          name: "Unmute video",
        })
      );
      playChatVideo("second-video");
      expect(videos[0]!.paused).toBe(true);
      expect(videos[0]!.currentTime).toBe(480);
      expect(videos[0]!.muted).toBe(false);
      expect(videos[1]!.paused).toBe(false);
      expect(videos[2]).not.toHaveAttribute("src");
    }
  );

  it("pauses desktop chat videos offscreen and while hidden without resuming on return", () => {
    mockIsApp = false;
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
    jest.spyOn(touchFirst, "isTouchFirstEnvironment").mockReturnValue(false);
    render(chatVideos());
    playChatVideo("first-video");
    const first =
      screen.getAllByLabelText<HTMLVideoElement>("Video player")[0]!;
    metadata(first);
    first.currentTime = 480;
    fireEvent.seeked(first);
    act(() => {
      mockInView = false;
      mockVisibilityListeners.forEach((notify) => notify());
    });
    expect(first.paused).toBe(true);
    act(() => {
      mockInView = true;
      mockVisibilityListeners.forEach((notify) => notify());
    });
    expect(first.paused).toBe(true);
    playChatVideo("first-video");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    fireEvent(document, new Event("visibilitychange"));
    expect(first.paused).toBe(true);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    fireEvent(document, new Event("visibilitychange"));
    expect(first.paused).toBe(true);
    expect(first.currentTime).toBe(480);
    playChatVideo("first-video");
    expect(first.paused).toBe(false);
  });

  it("keeps a user-started chat source stable if a better rendition appears later", () => {
    const optimize = jest.requireMock("@/hooks/useOptimizedVideo")
      .useOptimizedVideo as jest.Mock;
    const { rerender } = render(chatVideos());
    playChatVideo("first-video");
    const first =
      screen.getAllByLabelText<HTMLVideoElement>("Video player")[0]!;
    const original = first.getAttribute("src");
    optimize.mockImplementation((src: string) => ({
      playableUrl: `optimized-${src}`,
      isHls: false,
    }));
    rerender(chatVideos());
    expect(first.getAttribute("src")).toBe(original);
    expect(first.paused).toBe(false);
    optimize.mockImplementation((src: string) => ({
      playableUrl: src,
      isHls: false,
    }));
  });

  it("preserves desktop autoplay outside the chat provider for submission media", () => {
    mockIsApp = false;
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
    jest.spyOn(touchFirst, "isTouchFirstEnvironment").mockReturnValue(false);
    render(
      <>
        <DropListItemContentMediaVideo src="submission.mp4" />
        <MediaDisplayVideo src="artwork.mp4" />
      </>
    );
    const videos = screen.getAllByLabelText<HTMLVideoElement>("Video player");
    expect(
      videos.every(
        (video) => Boolean(video.getAttribute("src")) && !video.paused
      )
    ).toBe(true);
  });

  it.each([false, true])(
    "completes an asynchronous HLS Play only if it is still the selected video (superseded=%s)",
    async (superseded) => {
      const optimize = jest.requireMock("@/hooks/useOptimizedVideo")
        .useOptimizedVideo as jest.Mock;
      optimize.mockImplementation((src: string) => ({
        playableUrl: src === "first.mp4" ? "first.m3u8" : src,
        isHls: src === "first.mp4",
      }));
      const play = jest.mocked(HTMLMediaElement.prototype.play);
      const usualPlay = play.getMockImplementation()!;
      play.mockImplementation(function (this: HTMLMediaElement) {
        if (!this.getAttribute("src"))
          return Promise.reject(
            new DOMException("No source yet", "NotSupportedError")
          );
        return usualPlay.call(this);
      });
      render(chatVideos());
      const videos = screen.getAllByLabelText<HTMLVideoElement>("Video player");
      playChatVideo("first-video");
      if (superseded) playChatVideo("second-video");
      await waitFor(() =>
        expect(videos[0]).toHaveAttribute(
          "src",
          expect.stringContaining("first.mp4")
        )
      );
      metadata(videos[0]!);
      expect(videos[0]!.paused).toBe(superseded);
      if (superseded) expect(videos[1]!.paused).toBe(false);
      optimize.mockImplementation((src: string) => ({
        playableUrl: src,
        isHls: false,
      }));
    }
  );

  it("keeps native fullscreen playback while offscreen and pauses when fullscreen closes", () => {
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    render(chatVideos());
    playChatVideo("first-video");
    const first =
      screen.getAllByLabelText<HTMLVideoElement>("Video player")[0]!;
    Object.defineProperty(first, "webkitDisplayingFullscreen", {
      configurable: true,
      value: true,
    });
    fireEvent(first, new Event("webkitbeginfullscreen"));
    act(() => {
      mockInView = false;
      mockVisibilityListeners.forEach((notify) => notify());
    });
    expect(first.paused).toBe(false);
    Object.defineProperty(first, "webkitDisplayingFullscreen", {
      configurable: true,
      value: false,
    });
    fireEvent(first, new Event("webkitendfullscreen"));
    expect(first.paused).toBe(true);
  });
});
