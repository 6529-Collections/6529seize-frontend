import { render, waitFor, act } from "@testing-library/react";
import React from "react";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";

let mockHlsSupported = false;
const mockHlsLoadSource = jest.fn();
const mockHlsAttachMedia = jest.fn();

jest.mock("hls.js", () => {
  class MockHls {
    static Events = {
      ERROR: "error",
      MANIFEST_PARSED: "manifestParsed",
    };
    static ErrorTypes = {
      NETWORK_ERROR: "networkError",
      MEDIA_ERROR: "mediaError",
      KEY_SYSTEM_ERROR: "keySystemError",
      MUX_ERROR: "muxError",
      OTHER_ERROR: "otherError",
    };
    static ErrorDetails = {
      MANIFEST_LOAD_ERROR: "manifestLoadError",
      MANIFEST_LOAD_TIMEOUT: "manifestLoadTimeout",
    };
    static isSupported() {
      return mockHlsSupported;
    }
    // no-op methods used by the hook
    on() {}
    loadSource(src: string) {
      mockHlsLoadSource(src);
    }
    attachMedia(video: HTMLVideoElement) {
      mockHlsAttachMedia(video);
    }
    startLoad() {}
    recoverMediaError() {}
    stopLoad() {}
    detachMedia() {}
    destroy() {}
  }
  return { __esModule: true, default: MockHls };
});

// Mock HTMLVideoElement.play to return a Promise
Object.defineProperty(HTMLVideoElement.prototype, "play", {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
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

function TestComponent(props: any) {
  const { videoRef, isLoading } = useHlsPlayer(props);
  return <video data-testid="vid" ref={videoRef} data-loading={isLoading} />;
}

describe("useHlsPlayer", () => {
  beforeEach(() => {
    mockHlsSupported = false;
    jest.clearAllMocks();
    (HTMLVideoElement.prototype.canPlayType as jest.Mock).mockReturnValue("");
  });

  it("handles non-HLS video sources correctly", () => {
    const { getByTestId } = render(
      <TestComponent src="video.mp4" isHls={false} />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    expect(video.src).toContain("video.mp4");
    expect(video.getAttribute("data-loading")).toBe("false");
  });

  it("uses native HLS when Hls.js is unavailable and the browser supports it", async () => {
    (HTMLVideoElement.prototype.canPlayType as jest.Mock).mockReturnValue(
      "probably"
    );

    const { getByTestId } = render(
      <TestComponent src="video.m3u8" isHls fallbackSrc="fallback.mp4" />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    await waitFor(() => {
      expect(video.src).toContain("video.m3u8");
      expect(video.getAttribute("data-loading")).toBe("false");
    });
  });

  it("prefers Hls.js over a Chromium-style maybe response", async () => {
    mockHlsSupported = true;
    (HTMLVideoElement.prototype.canPlayType as jest.Mock).mockReturnValue(
      "maybe"
    );

    const { getByTestId } = render(
      <TestComponent src="video.m3u8" isHls fallbackSrc="fallback.mp4" />
    );
    const video = getByTestId("vid") as HTMLVideoElement;

    await waitFor(() => {
      expect(mockHlsLoadSource).toHaveBeenCalledWith("video.m3u8");
    });
    expect(mockHlsAttachMedia).toHaveBeenCalledWith(video);
    expect(video.src).not.toContain("video.m3u8");
  });

  it("falls back when native HLS emits an error", async () => {
    (HTMLVideoElement.prototype.canPlayType as jest.Mock).mockReturnValue(
      "probably"
    );

    const { getByTestId } = render(
      <TestComponent src="video.m3u8" isHls fallbackSrc="fallback.mp4" />
    );
    const video = getByTestId("vid") as HTMLVideoElement;

    await waitFor(() => {
      expect(video.src).toContain("video.m3u8");
    });

    act(() => {
      video.dispatchEvent(new Event("error"));
    });

    expect(video.src).toContain("fallback.mp4");
    expect(video.getAttribute("data-loading")).toBe("false");
  });

  it("sets src correctly for HLS when fallback is provided and HLS fails", async () => {
    const { getByTestId } = render(
      <TestComponent src="video.m3u8" isHls={true} fallbackSrc="fallback.mp4" />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    expect(video.getAttribute("data-loading")).toBe("true");
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(video.getAttribute("data-loading")).toBe("false");
    });
    expect(video.src).toContain("fallback.mp4");
  });

  it("handles autoPlay prop correctly for non-HLS videos", () => {
    const { getByTestId } = render(
      <TestComponent src="video.mp4" isHls={false} autoPlay={true} />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    expect(video.src).toContain("video.mp4");
    expect(video.getAttribute("data-loading")).toBe("false");
  });

  it("does not attach a source while disabled", () => {
    const { getByTestId } = render(
      <TestComponent src="video.mp4" isHls={false} enabled={false} />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    expect(video.src).toBe("");
    expect(video.getAttribute("data-loading")).toBe("false");
  });

  it("cleans up video on unmount", () => {
    const { getByTestId, unmount } = render(
      <TestComponent src="v.mp4" isHls={false} />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    const pauseSpy = jest.spyOn(video, "pause");
    unmount();
    expect(pauseSpy).toHaveBeenCalled();
    expect(video.src).toBe("");
  });

  it("updates src when changed", () => {
    const { getByTestId, rerender } = render(
      <TestComponent src="a.mp4" isHls={false} />
    );
    rerender(<TestComponent src="b.mp4" isHls={false} />);
    const video = getByTestId("vid") as HTMLVideoElement;
    expect(video.src).toContain("b.mp4");
  });
});
