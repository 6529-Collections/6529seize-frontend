import { render, act } from "@testing-library/react";
import React from "react";

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
});

function TestComp(props: any) {
  const { videoRef, isLoading } = useHlsPlayer(props);
  return <video data-testid="v" ref={videoRef} data-loading={isLoading} />;
}

describe("useHlsPlayer hls supported", () => {
  beforeEach(() => {
    (require("hls.js").default as any).instances.length = 0;
  });

  it("initializes Hls and handles manifest parsed", async () => {
    const onParsed = jest.fn();
    const { getByTestId } = render(
      <TestComp src="a.m3u8" isHls autoPlay onManifestParsed={onParsed} />
    );
    await new Promise((r) => setTimeout(r, 0));
    const video = getByTestId("v") as any;
    const hlsInstance = (require("hls.js").default as any).instances[0];
    expect(hlsInstance.loadSource).toHaveBeenCalledWith("a.m3u8");
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
