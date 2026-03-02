import { act, renderHook, waitFor } from "@testing-library/react";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";

const mockCopyToClipboard = jest.fn();
const mockCapacitorIsNativePlatform = jest.fn();
const mockCapacitorShare = jest.fn();

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => mockCapacitorIsNativePlatform(),
  },
}));

jest.mock("@capacitor/share", () => ({
  Share: {
    share: (...args: unknown[]) => mockCapacitorShare(...args),
  },
}));

jest.mock("react-use", () => {
  const actual = jest.requireActual("react-use");
  return {
    __esModule: true,
    ...actual,
    useCopyToClipboard: () => [null, mockCopyToClipboard],
  };
});

describe("useWaveShareCopyAction", () => {
  const setNavigatorShare = (shareImpl?: unknown) => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareImpl,
    });
  };

  const renderUseWaveShareCopyAction = () =>
    renderHook(() =>
      useWaveShareCopyAction({
        waveId: "w1",
        waveName: "Wave",
        isDirectMessage: false,
      })
    );

  beforeEach(() => {
    mockCopyToClipboard.mockReset();
    mockCapacitorShare.mockReset();
    mockCapacitorIsNativePlatform.mockReset();
    mockCapacitorIsNativePlatform.mockReturnValue(false);
    mockCapacitorShare.mockResolvedValue({});
    setNavigatorShare(undefined);
  });

  it("uses share mode in app context when running under Capacitor", () => {
    mockCapacitorIsNativePlatform.mockReturnValue(true);

    const { result } = renderUseWaveShareCopyAction();

    expect(result.current.mode).toBe("share");
    expect(result.current.label).toBe("Share wave");
  });

  it("uses Capacitor Share plugin in app context", async () => {
    mockCapacitorIsNativePlatform.mockReturnValue(true);

    const { result } = renderUseWaveShareCopyAction();

    act(() => {
      result.current.onClick();
    });

    await waitFor(() =>
      expect(mockCapacitorShare).toHaveBeenCalledWith({
        title: "Wave",
        url: "https://test.6529.io/waves/w1",
      })
    );
    expect(mockCopyToClipboard).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.label).toBe("Link shared"));
  });

  it("falls back to copy after non-abort Capacitor share failure", async () => {
    mockCapacitorIsNativePlatform.mockReturnValue(true);
    mockCapacitorShare.mockRejectedValue(new Error("Share failed"));

    const { result } = renderUseWaveShareCopyAction();

    act(() => {
      result.current.onClick();
    });

    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "https://test.6529.io/waves/w1"
      )
    );
    await waitFor(() => expect(result.current.mode).toBe("copy"));
  });

  it("does not fallback to copy when Capacitor share is cancelled", async () => {
    mockCapacitorIsNativePlatform.mockReturnValue(true);
    const abortError = new Error("Cancelled");
    Object.defineProperty(abortError, "name", { value: "AbortError" });
    mockCapacitorShare.mockRejectedValue(abortError);

    const { result } = renderUseWaveShareCopyAction();

    act(() => {
      result.current.onClick();
    });

    await waitFor(() => expect(mockCapacitorShare).toHaveBeenCalledTimes(1));
    expect(mockCopyToClipboard).not.toHaveBeenCalled();
    expect(result.current.mode).toBe("share");
  });

  it("uses copy mode on web when navigator.share is unavailable", () => {
    const { result } = renderUseWaveShareCopyAction();

    expect(result.current.mode).toBe("copy");
    expect(result.current.label).toBe("Copy wave link");

    act(() => {
      result.current.onClick();
    });

    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      "http://localhost/waves/w1"
    );
  });
});
