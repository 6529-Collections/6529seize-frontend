import { render, waitFor, act, fireEvent } from "@testing-library/react";
import React from "react";
import { Capacitor } from "@capacitor/core";
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
  const { videoRef, isLoading, retry } = useHlsPlayer(props);
  return (
    <>
      <video data-testid="vid" ref={videoRef} data-loading={isLoading} />
      <button type="button" onClick={retry}>
        Retry
      </button>
    </>
  );
}

describe("useHlsPlayer", () => {
  beforeEach(() => {
    mockHlsSupported = false;
    jest.clearAllMocks();
    (HTMLVideoElement.prototype.canPlayType as jest.Mock).mockReturnValue("");
  });

  it("does not warn when pausing cancels pending fallback autoplay", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    let rejectPlayback: ((reason: unknown) => void) | undefined;
    const pendingPlayback = new Promise<void>((_resolve, reject) => {
      rejectPlayback = reject;
    });
    (HTMLVideoElement.prototype.play as jest.Mock).mockReturnValueOnce(
      pendingPlayback
    );
    try {
      const { rerender } = render(
        <TestComponent src="video.mp4" isHls={false} autoPlay />
      );
      expect(HTMLVideoElement.prototype.play).toHaveBeenCalled();
      rerender(
        <TestComponent src="video.mp4" isHls={false} autoPlay enabled={false} />
      );
      expect(HTMLVideoElement.prototype.pause).toHaveBeenCalled();
      await act(async () => {
        rejectPlayback?.(
          new DOMException("Playback interrupted", "AbortError")
        );
        await pendingPlayback.catch(() => {});
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it.each([
    new DOMException("Autoplay blocked", "NotAllowedError"),
    new Error("Playback failed"),
  ])("still warns for other fallback autoplay failures: %s", async (error) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    (HTMLVideoElement.prototype.play as jest.Mock).mockRejectedValueOnce(error);
    try {
      render(<TestComponent src="video.mp4" isHls={false} autoPlay />);
      await waitFor(() => {
        expect(warn).toHaveBeenCalledWith("Fallback autoplay failed:", error);
      });
    } finally {
      warn.mockRestore();
    }
  });

  it("unloads offscreen native raw video and restores its position without starting playback", () => {
    const native = jest
      .spyOn(Capacitor, "isNativePlatform")
      .mockReturnValue(true);
    try {
      const { getByTestId, rerender } = render(
        <TestComponent src="video.mp4" isHls={false} />
      );
      const video = getByTestId("vid") as HTMLVideoElement;
      video.currentTime = 12;
      jest.mocked(HTMLVideoElement.prototype.play).mockClear();
      rerender(<TestComponent src="video.mp4" isHls={false} enabled={false} />);
      expect(video).not.toHaveAttribute("src");
      rerender(<TestComponent src="video.mp4" isHls={false} enabled />);
      expect(video.src).toContain("video.mp4");
      fireEvent.loadedMetadata(video);
      expect(video.currentTime).toBe(12);
      expect(HTMLVideoElement.prototype.play).not.toHaveBeenCalled();
    } finally {
      native.mockRestore();
    }
  });

  it("handles non-HLS video sources correctly", () => {
    const { getByTestId } = render(
      <TestComponent src="video.mp4" isHls={false} />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    expect(video.src).toContain("video.mp4");
    expect(video.getAttribute("data-loading")).toBe("false");
  });

  it("resolves relative video sources against the document base URI", () => {
    const base = document.createElement("base");
    base.href = "https://example.com/waves/quick-vote/";
    document.head.append(base);

    try {
      const { getByTestId } = render(
        <TestComponent src="media/video.mp4" isHls={false} />
      );

      expect((getByTestId("vid") as HTMLVideoElement).src).toBe(
        "https://example.com/waves/quick-vote/media/video.mp4"
      );
    } finally {
      base.remove();
    }
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

  it("reloads native HLS when retry is requested", async () => {
    (HTMLVideoElement.prototype.canPlayType as jest.Mock).mockReturnValue(
      "probably"
    );

    const { getByTestId, getByRole } = render(
      <TestComponent src="video.m3u8" isHls fallbackSrc="fallback.mp4" />
    );
    const video = getByTestId("vid") as HTMLVideoElement;
    await waitFor(() => {
      expect(video.src).toContain("video.m3u8");
    });
    const loadSpy = HTMLVideoElement.prototype.load as jest.Mock;
    loadSpy.mockClear();

    fireEvent.click(getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(loadSpy).toHaveBeenCalled();
      expect(video.src).toContain("video.m3u8");
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
      expect(mockHlsLoadSource).toHaveBeenCalledWith(
        expect.stringContaining("video.m3u8")
      );
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

  it("keeps native HLS recovery armed after an offscreen error", async () => {
    const native = jest
      .spyOn(Capacitor, "isNativePlatform")
      .mockReturnValue(true);
    (HTMLVideoElement.prototype.canPlayType as jest.Mock).mockReturnValue(
      "probably"
    );
    try {
      const props = {
        src: "video.m3u8",
        isHls: true,
        fallbackSrc: "fallback.mp4",
      };
      const { getByTestId, rerender } = render(
        <TestComponent {...props} enabled />
      );
      const video = getByTestId("vid") as HTMLVideoElement;
      await waitFor(() => expect(video.src).toContain("video.m3u8"));
      rerender(<TestComponent {...props} enabled={false} />);
      expect(video).not.toHaveAttribute("src");
      fireEvent.error(video);
      expect(video).not.toHaveAttribute("src");
      rerender(<TestComponent {...props} enabled />);
      expect(video.src).toContain("video.m3u8");
      fireEvent.error(video);
      expect(video.src).toContain("fallback.mp4");
    } finally {
      native.mockRestore();
    }
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

  it("reloads a non-HLS source when retry is requested", () => {
    const { getByRole } = render(
      <TestComponent src="video.mp4" isHls={false} />
    );
    const loadSpy = HTMLVideoElement.prototype.load as jest.Mock;
    loadSpy.mockClear();

    fireEvent.click(getByRole("button", { name: "Retry" }));

    expect(loadSpy).toHaveBeenCalled();
  });

  it("rejects unsafe video source protocols", () => {
    const { getByTestId } = render(
      <TestComponent src="javascript:alert(1)" isHls={false} />
    );

    expect((getByTestId("vid") as HTMLVideoElement).src).toBe("");
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
