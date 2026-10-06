import { render, act, waitFor } from "@testing-library/react";
import React from "react";
import { Capacitor } from "@capacitor/core";
import * as touchFirst from "@/helpers/touch-first.helpers";

let mockAppActive = true;
jest.mock("@/hooks/useMobileAppActivity", () => ({
  ...jest.requireActual("@/hooks/useMobileAppActivity"),
  useMobileAppActivity: () => mockAppActive,
}));
jest.mock("@/services/app-activity/mobile-app-activity", () => ({
  ...jest.requireActual("@/services/app-activity/mobile-app-activity"),
  getMobileAppActivity: () => mockAppActive,
}));

declare const global: any;

// Create a mock implementation of hls.js with support enabled
jest.mock("hls.js", () => {
  const instances: any[] = [];
  class MockHls {
    static instances = instances;
    static isSupported() {
      return true;
    }
    static Events = { MANIFEST_PARSED: "manifest", ERROR: "error" };
    static ErrorTypes = {
      KEY_SYSTEM_ERROR: "key",
      MEDIA_ERROR: "media",
      MUX_ERROR: "mux",
      NETWORK_ERROR: "network",
      OTHER_ERROR: "other",
    };
    static ErrorDetails = {
      MANIFEST_LOAD_ERROR: "load",
      MANIFEST_LOAD_TIMEOUT: "timeout",
    };
    handlers: Record<string, any> = {};
    constructor() {
      instances.push(this);
    }
    on(event: string, cb: any) {
      this.handlers[event] = cb;
    }
    loadSource = jest.fn();
    attachMedia = jest.fn();
    startLoad = jest.fn();
    recoverMediaError = jest.fn();
    stopLoad = jest.fn();
    detachMedia = jest.fn();
    destroy = jest.fn();
    trigger(event: string, data?: any) {
      this.handlers[event]?.(event, data);
    }
  }
  return { __esModule: true, default: MockHls };
});

// must import after mocking
import { useHlsPlayer } from "@/hooks/useHlsPlayer";

Object.defineProperty(HTMLVideoElement.prototype, "play", {
  writable: true,
  value: jest.fn(() => Promise.resolve()),
});
Object.defineProperty(HTMLVideoElement.prototype, "load", {
  writable: true,
  value: jest.fn(),
});
Object.defineProperty(HTMLVideoElement.prototype, "pause", {
  writable: true,
  value: jest.fn(),
});
Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", {
  writable: true,
  value: jest.fn(() => ""),
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function TestComp(props: any) {
  const { videoRef, isLoading } = useHlsPlayer(props);
  return <video data-testid="v" ref={videoRef} data-loading={isLoading} />;
}

describe("useHlsPlayer hls supported", () => {
  beforeEach(() => {
    mockAppActive = true;
    jest.clearAllMocks();
    (require("hls.js").default as any).instances.length = 0;
  });

  it("stops HLS downloads and playback while inactive without destroying the player", async () => {
    const Hls = require("hls.js").default;
    const { getByTestId, rerender } = render(
      <TestComp src="a.m3u8" isHls autoPlay />
    );
    await waitFor(() => expect(Hls.instances).toHaveLength(1));
    const hls = Hls.instances[0];
    const video = getByTestId("v") as HTMLVideoElement;
    video.currentTime = 12;
    mockAppActive = false;
    rerender(<TestComp src="a.m3u8" isHls autoPlay />);
    expect(hls.stopLoad).toHaveBeenCalled();
    expect(hls.destroy).not.toHaveBeenCalled();
    expect(video.currentTime).toBe(12);
    act(() => hls.trigger("manifest"));
    expect(HTMLVideoElement.prototype.play).not.toHaveBeenCalled();
    mockAppActive = true;
    rerender(<TestComp src="a.m3u8" isHls autoPlay />);
    expect(hls.startLoad).toHaveBeenCalledWith(-1);
    expect(Hls.instances).toHaveLength(1);
    expect(video.currentTime).toBe(12);
  });

  it.each([true, false])(
    "keeps an attached mobile HLS pipeline when activity alone changes (native=%s)",
    async (native) => {
      jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(native);
      jest.spyOn(touchFirst, "isTouchFirstEnvironment").mockReturnValue(true);
      const Hls = require("hls.js").default;
      const props = { src: "a.m3u8", isHls: true, enabled: true };
      const { getByTestId, rerender } = render(<TestComp {...props} />);
      await waitFor(() => expect(Hls.instances).toHaveLength(1));
      const hls = Hls.instances[0];
      const video = getByTestId("v") as HTMLVideoElement;
      video.currentTime = 480;
      jest.mocked(HTMLVideoElement.prototype.load).mockClear();
      mockAppActive = false;
      rerender(<TestComp {...props} />);
      expect(hls.stopLoad).toHaveBeenCalledTimes(1);
      expect(hls.destroy).not.toHaveBeenCalled();
      expect(hls.detachMedia).not.toHaveBeenCalled();
      mockAppActive = true;
      rerender(<TestComp {...props} />);
      expect(hls.startLoad).toHaveBeenCalledWith(-1);
      expect(Hls.instances).toHaveLength(1);
      expect(hls.loadSource).toHaveBeenCalledTimes(1);
      expect(hls.attachMedia).toHaveBeenCalledTimes(1);
      expect(video.currentTime).toBe(480);
      expect(HTMLVideoElement.prototype.load).not.toHaveBeenCalled();
    }
  );

  it.each([true, false])(
    "reuses only the HLS pipeline across rapid mobile visibility/activity changes (native=%s)",
    async (native) => {
      jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(native);
      jest.spyOn(touchFirst, "isTouchFirstEnvironment").mockReturnValue(true);
      const Hls = require("hls.js").default;
      const props = { src: "a.m3u8", isHls: true };
      const { getByTestId, rerender } = render(<TestComp {...props} enabled />);
      await waitFor(() => expect(Hls.instances).toHaveLength(1));
      const hls = Hls.instances[0];
      const video = getByTestId("v");
      jest.mocked(HTMLVideoElement.prototype.load).mockClear();
      for (let cycle = 0; cycle < 3; cycle += 1) {
        rerender(<TestComp {...props} enabled={false} />);
        mockAppActive = false;
        rerender(<TestComp {...props} enabled />);
        mockAppActive = true;
        rerender(<TestComp {...props} enabled />);
      }
      expect(Hls.instances).toHaveLength(1);
      expect(hls.startLoad).toHaveBeenCalledTimes(3);
      expect(hls.startLoad).toHaveBeenLastCalledWith(-1);
      expect(hls.destroy).not.toHaveBeenCalled();
      expect(video).not.toHaveAttribute("src");
      expect(HTMLVideoElement.prototype.load).not.toHaveBeenCalled();
    }
  );

  it.each([true, false])(
    "suspends an offscreen mobile HLS player, preserves fullscreen, and reuses the same instance (native=%s)",
    async (native) => {
      jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(native);
      jest.spyOn(touchFirst, "isTouchFirstEnvironment").mockReturnValue(true);
      const Hls = require("hls.js").default;
      const { getByTestId, rerender } = render(
        <TestComp src="a.m3u8" isHls enabled />
      );
      await waitFor(() => expect(Hls.instances).toHaveLength(1));
      const hls = Hls.instances[0];
      const video = getByTestId("v");
      act(() => video.dispatchEvent(new Event("webkitbeginfullscreen")));
      rerender(<TestComp src="a.m3u8" isHls enabled={false} />);
      expect(hls.stopLoad).not.toHaveBeenCalled();
      act(() => video.dispatchEvent(new Event("webkitendfullscreen")));
      expect(hls.stopLoad).toHaveBeenCalled();
      expect(hls.destroy).not.toHaveBeenCalled();
      rerender(<TestComp src="a.m3u8" isHls enabled />);
      expect(hls.startLoad).toHaveBeenCalledWith(-1);
      expect(Hls.instances).toHaveLength(1);
    }
  );

  it("keeps eager native initialization from buffering offscreen video", async () => {
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const Hls = require("hls.js").default;
    const { rerender } = render(
      <TestComp src="a.m3u8" isHls enabled bufferingEnabled={false} />
    );
    await waitFor(() => expect(Hls.instances).toHaveLength(1));
    const hls = Hls.instances[0];
    expect(hls.stopLoad).toHaveBeenCalled();
    rerender(<TestComp src="a.m3u8" isHls enabled bufferingEnabled />);
    expect(hls.startLoad).toHaveBeenCalledWith(-1);
    expect(hls.destroy).not.toHaveBeenCalled();
  });

  it("does not autoplay after a native source is suspended during the HLS import", async () => {
    jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const Hls = require("hls.js").default;
    const { rerender } = render(
      <TestComp src="a.m3u8" isHls enabled autoPlay />
    );
    mockAppActive = false;
    rerender(<TestComp src="a.m3u8" isHls enabled autoPlay />);
    await waitFor(() => expect(Hls.instances).toHaveLength(1));
    const hls = Hls.instances[0];
    expect(hls.stopLoad).toHaveBeenCalled();
    act(() => hls.trigger("manifest"));
    expect(HTMLVideoElement.prototype.play).not.toHaveBeenCalled();
  });

  it("initializes Hls and handles manifest parsed", async () => {
    const onParsed = jest.fn();
    const { getByTestId } = render(
      <TestComp src="a.m3u8" isHls autoPlay onManifestParsed={onParsed} />
    );
    await new Promise((r) => setTimeout(r, 0));
    const video = getByTestId("v") as any;
    const hlsInstance = (require("hls.js").default as any).instances[0];
    expect(hlsInstance.loadSource).toHaveBeenCalledWith(
      expect.stringContaining("a.m3u8")
    );
    act(() => {
      hlsInstance.trigger("manifest");
    });
    expect(onParsed).toHaveBeenCalled();
    expect(video.dataset.loading).toBe("false");
  });

  it("caps manifest retries before falling back to the original source", async () => {
    jest.useFakeTimers();
    const { getByTestId } = render(
      <TestComp src="a.m3u8" isHls fallbackSrc="fallback.mp4" />
    );
    await act(async () => {
      await Promise.resolve();
    });

    const video = getByTestId("v") as HTMLVideoElement;
    const instances = (require("hls.js").default as any).instances;
    const hlsInstance = instances[instances.length - 1];
    const manifestError = {
      fatal: true,
      type: "network",
      details: "load",
    };

    act(() => {
      hlsInstance.trigger("error", manifestError);
      jest.advanceTimersByTime(2000);
    });
    act(() => {
      hlsInstance.trigger("error", manifestError);
      jest.advanceTimersByTime(2000);
    });
    act(() => {
      hlsInstance.trigger("error", manifestError);
    });

    expect(hlsInstance.loadSource).toHaveBeenCalledTimes(3);
    expect(video.src).toContain("fallback.mp4");
  });

  it("does not attach Hls if disabled before the dynamic import resolves", async () => {
    const Hls = require("hls.js").default as any;
    const { rerender } = render(
      <TestComp src="late.m3u8" isHls enabled={true} />
    );

    rerender(<TestComp src="late.m3u8" isHls enabled={false} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(Hls.instances).toHaveLength(0);
  });
});
