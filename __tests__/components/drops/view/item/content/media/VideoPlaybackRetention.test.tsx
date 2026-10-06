import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import * as touchFirst from "@/helpers/touch-first.helpers";
import * as config from "@/components/drops/view/item/content/media/SeizeVideoPlayer.config";
import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";
import VirtualScrollWrapper from "@/components/waves/drops/VirtualScrollWrapper";
import { DropSize } from "@/helpers/waves/drop.helpers";

let mockInView = true;
let mockIsApp = true;
let mockSetInView: React.Dispatch<React.SetStateAction<boolean>>;
const mockFetchAround = jest.fn();
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
  useOptimizedVideo: (src: string) => ({ playableUrl: src, isHls: false }),
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
    jest.spyOn(config, "useElementInView").mockImplementation(() => mockInView);
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

  function dropContent(src = "long.mp4") {
    return (
      <VirtualScrollWrapper
        scrollContainerRef={{ current: null }}
        dropSerialNo={1}
        waveId="wave"
        type={DropSize.FULL}
      >
        <DropListItemContentMediaVideo src={src} />
      </VirtualScrollWrapper>
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
    metadata(video);
    video.currentTime = 480;
    fireEvent.seeked(video);
    fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));
    rerender(dropContent("other.mp4"));
    const other = screen.getByLabelText<HTMLVideoElement>("Video player");
    expect(other).not.toBe(video);
    metadata(other);
    expect(other.currentTime).toBe(0);
    expect(other.muted).toBe(true);
    rerender(dropContent());
    const restored = screen.getByLabelText<HTMLVideoElement>("Video player");
    metadata(restored);
    expect(restored.currentTime).toBe(480);
    expect(restored.muted).toBe(false);
  });

  it("clears remembered playback when the chat wrapper is removed", () => {
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const { unmount } = renderDrop();
    const video = screen.getByLabelText<HTMLVideoElement>("Video player");
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
});
