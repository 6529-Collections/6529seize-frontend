import { renderHook, act, waitFor } from "@testing-library/react";
import { useActiveWaveManager } from "@/contexts/wave/hooks/useActiveWaveManager";
import { useSearchParams } from "next/navigation";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
    isAppleMobile: false,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe("useActiveWaveManager", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    globalThis.history.replaceState(null, "", "http://localhost/");
  });

  it("reads wave from query and updates via setActiveWave", async () => {
    globalThis.history.replaceState(null, "", "http://localhost/waves?wave=abc");
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ wave: "abc" })
    );

    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");
    const replaceStateSpy = jest.spyOn(globalThis.history, "replaceState");

    const { result, rerender } = renderHook(() => useActiveWaveManager());
    await waitFor(() => expect(result.current.activeWaveId).toBe("abc"));

    replaceStateSpy.mockClear();
    act(() => {
      result.current.setActiveWave("def");
    });
    expect(pushStateSpy).toHaveBeenLastCalledWith(null, "", "/waves?wave=def");

    globalThis.history.replaceState(null, "", "http://localhost/waves?wave=def");
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ wave: "def" })
    );
    rerender();
    await waitFor(() => expect(result.current.activeWaveId).toBe("def"));

    pushStateSpy.mockClear();
    act(() => {
      result.current.setActiveWave(null);
    });
    expect(pushStateSpy).toHaveBeenLastCalledWith(null, "", "/waves");
  });
});
