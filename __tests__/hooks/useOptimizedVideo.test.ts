import { act, renderHook, waitFor } from "@testing-library/react";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import {
  isVideoUrl,
  getVideoConversions,
  checkVideoAvailability,
} from "@/helpers/video.helpers";

jest.mock("@/helpers/video.helpers");
let mockAppActive = true;
jest.mock("@/hooks/useMobileAppActivity", () => ({
  ...jest.requireActual("@/hooks/useMobileAppActivity"),
  useMobileAppActivity: () => mockAppActive,
}));
beforeEach(() => {
  mockAppActive = true;
});

const mockIsVideoUrl = isVideoUrl as jest.Mock;
const mockGetConversions = getVideoConversions as jest.Mock;
const mockCheckAvailability = checkVideoAvailability as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe("useOptimizedVideo", () => {
  it("returns original url for non video", () => {
    mockIsVideoUrl.mockReturnValue(false);
    const { result } = renderHook(() => useOptimizedVideo("file.txt"));
    expect(result.current.playableUrl).toBe("file.txt");
    expect(result.current.isOptimized).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });

  it("picks optimized hls url when available", async () => {
    mockIsVideoUrl.mockReturnValue(true);
    mockGetConversions.mockReturnValue({
      HLS: "hls.m3u8",
      MP4_1080P: "1080.mp4",
      MP4_720P: "720.mp4",
    });
    mockCheckAvailability.mockResolvedValue(true);

    const { result } = renderHook(() => useOptimizedVideo("video.mp4"));
    await waitFor(() => expect(result.current.isOptimized).toBe(true));
    expect(result.current.playableUrl).toBe("hls.m3u8");
    expect(result.current.isHls).toBe(true);
  });

  it("retains a discovered rendition across native inactivity without probing again", async () => {
    mockIsVideoUrl.mockReturnValue(true);
    mockGetConversions.mockReturnValue({
      HLS: "hls.m3u8",
      MP4_1080P: "1080.mp4",
      MP4_720P: "720.mp4",
    });
    mockCheckAvailability.mockResolvedValue(true);
    const { result, rerender } = renderHook(() =>
      useOptimizedVideo("video.mp4")
    );
    await waitFor(() => expect(result.current.isHls).toBe(true));
    mockAppActive = false;
    rerender();
    expect(result.current.playableUrl).toBe("hls.m3u8");
    mockAppActive = true;
    rerender();
    expect(mockCheckAvailability).toHaveBeenCalledTimes(1);
  });

  it("drops a previous source rendition when the URL changes and probes a returning URL", async () => {
    mockIsVideoUrl.mockReturnValue(true);
    mockGetConversions.mockImplementation((url: string) => ({
      HLS: `${url}.m3u8`,
      MP4_1080P: `${url}.1080.mp4`,
      MP4_720P: `${url}.720.mp4`,
    }));
    mockCheckAvailability.mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ url }) => useOptimizedVideo(url),
      { initialProps: { url: "a.mp4" } }
    );
    await waitFor(() => expect(result.current.playableUrl).toBe("a.mp4.m3u8"));
    rerender({ url: "b.mp4" });
    await waitFor(() => expect(result.current.playableUrl).toBe("b.mp4.m3u8"));
    rerender({ url: "a.mp4" });
    await waitFor(() => expect(result.current.playableUrl).toBe("a.mp4.m3u8"));
    expect(mockCheckAvailability).toHaveBeenCalledTimes(3);
  });

  it("stops the probe chain if inactivity starts while a request is in flight", async () => {
    mockIsVideoUrl.mockReturnValue(true);
    mockGetConversions.mockReturnValue({
      HLS: "hls.m3u8",
      MP4_1080P: "1080.mp4",
      MP4_720P: "720.mp4",
    });
    let resolveProbe: ((available: boolean) => void) | undefined;
    mockCheckAvailability.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveProbe = resolve;
        })
    );
    const { rerender } = renderHook(() => useOptimizedVideo("video.mp4"));
    mockAppActive = false;
    rerender();
    await act(async () => resolveProbe?.(false));
    expect(mockCheckAvailability).toHaveBeenCalledTimes(1);
  });

  it("does not probe optimized renditions while disabled", () => {
    const { result } = renderHook(() =>
      useOptimizedVideo("video.mp4", { enabled: false })
    );

    expect(result.current.playableUrl).toBe("video.mp4");
    expect(result.current.isOptimized).toBe(false);
    expect(result.current.isChecking).toBe(false);
    expect(mockIsVideoUrl).not.toHaveBeenCalled();
    expect(mockCheckAvailability).not.toHaveBeenCalled();
  });
});
