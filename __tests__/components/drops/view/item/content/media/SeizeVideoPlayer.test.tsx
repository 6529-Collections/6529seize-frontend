import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";

function installIntersectionObserverMock() {
  let callback: IntersectionObserverCallback | undefined;
  const observe = jest.fn();
  const disconnect = jest.fn();

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [0.1];
    readonly observe = observe;
    readonly disconnect = disconnect;
    readonly unobserve = jest.fn();
    readonly takeRecords = jest.fn(() => []);

    constructor(nextCallback: IntersectionObserverCallback) {
      callback = nextCallback;
    }
  }

  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: MockIntersectionObserver,
  });

  return {
    disconnect,
    observe,
    trigger(isIntersecting: boolean) {
      act(() => {
        callback?.(
          [{ isIntersecting } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });
    },
  };
}

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

describe("SeizeVideoPlayer", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: false,
    });
    jest
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => undefined);
    jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    jest
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
  });

  it("advances through fallback sources when the direct source errors", () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/primary.mp4"
        fallbackSources={["https://example.com/fallback.mp4"]}
      />
    );

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "https://example.com/primary.mp4");

    if (!video) {
      throw new Error("Expected video element to render");
    }

    fireEvent.error(video);

    expect(video).toHaveAttribute("src", "https://example.com/fallback.mp4");
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
  });

  it("recovers to the first fallback source when the direct source is missing", () => {
    const { container } = render(
      <SeizeVideoPlayer
        fallbackSources={["https://example.com/fallback.mp4"]}
      />
    );

    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }

    fireEvent.error(video);

    expect(video).toHaveAttribute("src", "https://example.com/fallback.mp4");
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
  });

  it("toggles mute state from the custom control", async () => {
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    await userEvent.click(screen.getByRole("button", { name: "Unmute video" }));

    expect(
      screen.getByRole("button", { name: "Mute video" })
    ).toBeInTheDocument();
  });

  it("prevents hidden minimal controls from intercepting pointer input", () => {
    jest.useFakeTimers();

    try {
      const { container } = render(
        <SeizeVideoPlayer src="https://example.com/video.mp4" />
      );

      const video = container.querySelector("video");
      if (!video) {
        throw new Error("Expected video element to render");
      }

      Object.defineProperty(video, "paused", {
        configurable: true,
        value: false,
      });

      const muteButton = screen.getByRole("button", {
        name: "Unmute video",
      });
      const muteControlZone = muteButton.parentElement;
      if (!muteControlZone) {
        throw new Error("Expected mute control zone to render");
      }

      expect(video).toHaveAttribute("tabindex", "0");
      expect(muteControlZone).toHaveClass("tw-pointer-events-auto");

      act(() => {
        fireEvent.play(video);
        jest.advanceTimersByTime(1800);
      });

      expect(muteControlZone).toHaveClass("tw-pointer-events-none");
      expect(muteControlZone).not.toHaveClass("tw-pointer-events-auto");
      expect(muteButton).toHaveAttribute("tabindex", "-1");

      act(() => {
        video.focus();
      });

      expect(muteControlZone).toHaveClass("tw-pointer-events-auto");
      expect(muteButton).not.toHaveAttribute("tabindex");

      act(() => {
        jest.advanceTimersByTime(1800);
      });

      expect(muteControlZone).toHaveClass("tw-pointer-events-auto");
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps focused minimal controls visible across the hide timer", () => {
    jest.useFakeTimers();

    try {
      const { container } = render(
        <SeizeVideoPlayer src="https://example.com/video.mp4" />
      );

      const video = container.querySelector("video");
      if (!video) {
        throw new Error("Expected video element to render");
      }

      Object.defineProperty(video, "paused", {
        configurable: true,
        value: false,
      });

      const muteButton = screen.getByRole("button", {
        name: "Unmute video",
      });
      const muteControlZone = muteButton.parentElement;
      if (!muteControlZone) {
        throw new Error("Expected mute control zone to render");
      }

      act(() => {
        fireEvent.play(video);
        jest.advanceTimersByTime(1800);
      });

      expect(muteControlZone).toHaveClass("tw-pointer-events-none");
      expect(muteButton).toHaveAttribute("tabindex", "-1");

      act(() => {
        muteButton.focus();
      });

      expect(document.activeElement).toBe(muteButton);
      expect(muteControlZone).toHaveClass("tw-pointer-events-auto");
      expect(muteButton).not.toHaveAttribute("tabindex");

      act(() => {
        jest.advanceTimersByTime(1800);
      });

      expect(muteControlZone).toHaveClass("tw-pointer-events-auto");
      expect(muteButton).not.toHaveAttribute("tabindex");
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the same video element across minimal-control state changes", () => {
    jest.useFakeTimers();

    try {
      const { container } = render(
        <SeizeVideoPlayer src="https://example.com/video.mp4" />
      );

      const video = container.querySelector("video");
      if (!video) {
        throw new Error("Expected video element to render");
      }

      Object.defineProperty(video, "paused", {
        configurable: true,
        value: false,
      });

      act(() => {
        fireEvent.play(video);
        jest.advanceTimersByTime(1800);
      });

      expect(container.querySelector("video")).toBe(video);

      act(() => {
        fireEvent.pointerMove(video);
      });

      expect(container.querySelector("video")).toBe(video);
    } finally {
      jest.useRealTimers();
    }
  });

  it("syncs mute state when the muted prop changes", () => {
    const { rerender } = render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" muted={false} />
    );

    expect(
      screen.getByRole("button", { name: "Mute video" })
    ).toBeInTheDocument();

    rerender(
      <SeizeVideoPlayer src="https://example.com/video.mp4" muted={true} />
    );

    expect(
      screen.getByRole("button", { name: "Unmute video" })
    ).toBeInTheDocument();
  });

  it("does not carry a local mute toggle across source changes", async () => {
    const { rerender } = render(
      <SeizeVideoPlayer src="https://example.com/slide-1.mp4" muted={false} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Mute video" }));
    expect(
      screen.getByRole("button", { name: "Unmute video" })
    ).toBeInTheDocument();

    rerender(
      <SeizeVideoPlayer src="https://example.com/slide-2.mp4" muted={false} />
    );

    expect(
      screen.getByRole("button", { name: "Mute video" })
    ).toBeInTheDocument();
  });

  it("falls back to native iOS video fullscreen when wrapper fullscreen is unavailable", async () => {
    const webkitEnterFullscreen = jest.fn();
    Object.defineProperty(HTMLVideoElement.prototype, "webkitEnterFullscreen", {
      configurable: true,
      value: webkitEnterFullscreen,
    });
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: false,
    });

    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    await userEvent.click(screen.getByRole("button", { name: "Full screen" }));

    await waitFor(() => {
      expect(webkitEnterFullscreen).toHaveBeenCalled();
    });
  });

  it("uses the mounted player wrapper as its fullscreen target", async () => {
    const requestFullscreen = jest.fn().mockImplementation(function (
      this: HTMLElement | undefined
    ) {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: this,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    });
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    const { container } = render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" />
    );

    await userEvent.click(screen.getByRole("button", { name: "Full screen" }));

    await waitFor(() => {
      expect(requestFullscreen).toHaveBeenCalled();
    });
    const fullscreenTarget = requestFullscreen.mock.contexts[0] as HTMLElement;
    const video = container.querySelector("video");
    expect(fullscreenTarget).not.toBe(document.documentElement);
    expect(fullscreenTarget).toContainElement(video);
    expect(
      screen.getByRole("button", { name: "Exit full screen" })
    ).toBeInTheDocument();
  });

  it("can hide the fullscreen control", () => {
    render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        showFullscreen={false}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();
  });

  it("does not expose the player wrapper as an activating group", () => {
    render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay={false} />
    );

    expect(
      screen.queryByRole("group", { name: "Video player" })
    ).not.toBeInTheDocument();
  });

  it("toggles playback from the minimal play button", async () => {
    render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay={false} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Play video" }));

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("places minimal playback on the left and mute on the right", () => {
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay />);

    const pauseButton = screen.getByRole("button", { name: "Pause video" });
    const muteButton = screen.getByRole("button", { name: "Unmute video" });

    expect(pauseButton.parentElement).toHaveClass("tw-left-3");
    expect(muteButton.parentElement).toHaveClass("tw-right-3");
  });

  it("pauses minimal playback from video clicks without starting playback", () => {
    let paused = false;
    const { container } = render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay={false} />
    );
    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }
    Object.defineProperty(video, "paused", {
      configurable: true,
      get: () => paused,
    });
    fireEvent.play(video);

    const pauseCallsBeforeClick = jest.mocked(HTMLMediaElement.prototype.pause)
      .mock.calls.length;

    fireEvent.click(video);

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(
      pauseCallsBeforeClick + 1
    );
    fireEvent.pause(video);
    expect(screen.getByRole("button", { name: "Play video" })).toBeVisible();

    paused = true;
    const playCallsBeforeClick = jest.mocked(HTMLMediaElement.prototype.play)
      .mock.calls.length;

    fireEvent.click(video);

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(
      playCallsBeforeClick
    );
  });

  it("does not toggle playback from native-control video clicks", () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        template="watch-media"
      />
    );
    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }
    Object.defineProperty(video, "paused", {
      configurable: true,
      value: false,
    });

    fireEvent.click(video);

    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("keeps footer seeking disabled until duration is known", () => {
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    expect(screen.getByRole("slider", { name: "Seek video" })).toBeDisabled();
  });

  it("seeks minimal videos from the footer timeline", () => {
    const { container } = render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" />
    );
    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }
    Object.defineProperty(video, "duration", {
      configurable: true,
      value: 200,
    });
    video.currentTime = 0;

    fireEvent.durationChange(video);

    const seek = screen.getByRole("slider", { name: "Seek video" });
    expect(seek).not.toBeDisabled();

    jest.mocked(HTMLMediaElement.prototype.pause).mockClear();
    jest.mocked(HTMLMediaElement.prototype.play).mockClear();

    fireEvent.click(seek);

    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    fireEvent.change(seek, { target: { value: "25" } });

    expect(video.currentTime).toBe(50);
    expect(seek).toHaveValue("25");

    video.currentTime = 100;
    fireEvent.seeked(video);

    expect(seek).toHaveValue("50");
  });

  it("uses native controls for watch media and suppresses custom controls", () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        template="watch-media"
      />
    );

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("loop");
    expect(
      screen.queryByRole("button", { name: "Play video" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mute video" })
    ).not.toBeInTheDocument();
  });

  it("renders no fake caption track when captions are missing", () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        template="watch-media"
      />
    );

    expect(container.querySelector("track")).not.toBeInTheDocument();
  });

  it("renders real caption metadata when captions are provided", () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        template="watch-media"
        captionsSrc="https://example.com/captions.vtt"
        captionsLabel="English captions"
        captionsLang="en-US"
        captionsDefault
      />
    );

    const track = container.querySelector("track");
    expect(track).toHaveAttribute("kind", "captions");
    expect(track).toHaveAttribute("src", "https://example.com/captions.vtt");
    expect(track).toHaveAttribute("srclang", "en-US");
    expect(track).toHaveAttribute("label", "English captions");
    expect(track).toHaveAttribute("default");
  });

  it("uses localized default caption metadata when captions are provided without overrides", () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        template="watch-media"
        captionsSrc="https://example.com/captions.vtt"
      />
    );

    const track = container.querySelector("track");
    expect(track).toHaveAttribute("srclang", "en-US");
    expect(track).toHaveAttribute("label", "Captions");
  });

  it("provides a localized default video player label", () => {
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    expect(
      screen.getByLabelText("Video player", { selector: "video" })
    ).toBeInTheDocument();
  });

  it("lets the central paused affordance toggle playback", async () => {
    const playSpy = jest.spyOn(HTMLMediaElement.prototype, "play");
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    await userEvent.click(
      screen.getAllByRole("button", { name: "Play video" })[0]
    );

    expect(playSpy).toHaveBeenCalled();
  });

  it("renders no focusable player controls for card previews", () => {
    render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        template="card-preview"
        autoPlay
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Video player" })
    ).not.toBeInTheDocument();
  });

  it("gates poster playback behind an explicit play button", async () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/video.mp4"
        template="poster-gated"
      />
    );

    const video = container.querySelector("video");
    expect(video).not.toHaveAttribute("controls");
    expect(screen.getByRole("button", { name: "Play video preview" }));

    await userEvent.click(
      screen.getByRole("button", { name: "Play video preview" })
    );

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(video).toHaveAttribute("controls");
  });

  it("keeps a poster-gated video open across source changes for the same poster", async () => {
    const { container, rerender } = render(
      <SeizeVideoPlayer
        src="https://example.com/video-720.mp4"
        poster="https://example.com/poster.jpg"
        template="poster-gated"
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Play video preview" })
    );

    expect(container.querySelector("video")).toHaveAttribute("controls");

    rerender(
      <SeizeVideoPlayer
        src="https://example.com/video-1080.mp4"
        poster="https://example.com/poster.jpg"
        template="poster-gated"
      />
    );

    expect(container.querySelector("video")).toHaveAttribute("controls");
    expect(
      screen.queryByRole("button", { name: "Play video preview" })
    ).not.toBeInTheDocument();

    rerender(
      <SeizeVideoPlayer
        src="https://example.com/other-video.mp4"
        poster="https://example.com/other-poster.jpg"
        template="poster-gated"
      />
    );

    expect(container.querySelector("video")).not.toHaveAttribute("controls");
    expect(
      screen.getByRole("button", { name: "Play video preview" })
    ).toBeInTheDocument();
  });

  it("syncs mute changes to the DOM media element", async () => {
    const { container } = render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" muted={false} />
    );

    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }

    expect(video.muted).toBe(false);
    expect(video.defaultMuted).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Mute video" }));

    expect(video.muted).toBe(true);
    expect(video.defaultMuted).toBe(true);
  });

  it("stays paused when play is rejected", async () => {
    jest
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(new Error("blocked"));
    render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay={false} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Play video" }));

    expect(
      await screen.findByRole("button", { name: "Play video" })
    ).toBeInTheDocument();
  });

  it("plays and pauses player-owned autoplay based on visibility", async () => {
    const observer = installIntersectionObserverMock();
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay />);

    jest.mocked(HTMLMediaElement.prototype.play).mockClear();
    jest.mocked(HTMLMediaElement.prototype.pause).mockClear();

    observer.trigger(true);

    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    observer.trigger(false);

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("does not resume player-owned autoplay after the user pauses it", async () => {
    const observer = installIntersectionObserverMock();
    let paused = false;
    const { container } = render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay />
    );
    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }
    Object.defineProperty(video, "paused", {
      configurable: true,
      get: () => paused,
    });

    observer.trigger(true);
    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
    fireEvent.play(video);

    await userEvent.click(screen.getByRole("button", { name: "Pause video" }));
    paused = true;
    fireEvent.pause(video);

    jest.mocked(HTMLMediaElement.prototype.play).mockClear();
    observer.trigger(false);
    observer.trigger(true);

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("does not start player-owned autoplay when reduced motion is preferred", () => {
    mockPrefersReducedMotion(true);
    const observer = installIntersectionObserverMock();
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay />);

    jest.mocked(HTMLMediaElement.prototype.play).mockClear();
    jest.mocked(HTMLMediaElement.prototype.pause).mockClear();

    observer.trigger(true);

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("resets native fullscreen state when the native exit API is missing", async () => {
    const webkitEnterFullscreen = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(HTMLElement.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "webkitEnterFullscreen", {
      configurable: true,
      value: webkitEnterFullscreen,
    });
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: false,
    });

    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    await userEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(webkitEnterFullscreen).toHaveBeenCalled();

    expect(
      screen.getByRole("button", { name: "Exit full screen" })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Exit full screen" })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Full screen" })
      ).toBeInTheDocument();
    });
  });
});
