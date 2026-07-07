import { renderHook, act, waitFor } from "@testing-library/react";
import { useActiveWaveManager } from "@/contexts/wave/hooks/useActiveWaveManager";
import { usePathname } from "next/navigation";

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
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(),
}));

describe("useActiveWaveManager", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    globalThis.history.replaceState(null, "", "http://localhost/");
  });

  it("reads wave from pathname and updates via setActiveWave", async () => {
    globalThis.history.replaceState(null, "", "http://localhost/waves/abc");
    (usePathname as jest.Mock).mockReturnValue("/waves/abc");

    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");
    const replaceStateSpy = jest.spyOn(globalThis.history, "replaceState");

    const { result, rerender } = renderHook(() => useActiveWaveManager());
    await waitFor(() => expect(result.current.activeWaveId).toBe("abc"));

    replaceStateSpy.mockClear();
    act(() => {
      result.current.setActiveWave("def");
    });
    expect(pushStateSpy).toHaveBeenLastCalledWith(null, "", "/waves/def");

    globalThis.history.replaceState(null, "", "http://localhost/waves/def");
    (usePathname as jest.Mock).mockReturnValue("/waves/def");
    rerender();
    await waitFor(() => expect(result.current.activeWaveId).toBe("def"));

    pushStateSpy.mockClear();
    act(() => {
      result.current.setActiveWave(null);
    });
    expect(pushStateSpy).toHaveBeenLastCalledWith(null, "", "/waves");
  });

  it("updates active wave when query params change through pushState", async () => {
    globalThis.history.replaceState(
      null,
      "",
      "http://localhost/messages?wave=wave-1"
    );
    (usePathname as jest.Mock).mockReturnValue("/messages");

    const { result } = renderHook(() => useActiveWaveManager());
    await waitFor(() => expect(result.current.activeWaveId).toBe("wave-1"));

    act(() => {
      globalThis.history.pushState(null, "", "/messages?wave=wave-2");
    });

    await waitFor(() => expect(result.current.activeWaveId).toBe("wave-2"));
  });

  it("includes serialNo when provided via options", async () => {
    globalThis.history.replaceState(null, "", "http://localhost/waves");
    (usePathname as jest.Mock).mockReturnValue("/waves");

    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");

    const { result } = renderHook(() => useActiveWaveManager());

    act(() => {
      result.current.setActiveWave("wave-123", { serialNo: 42 });
    });
    expect(pushStateSpy).toHaveBeenLastCalledWith(
      null,
      "",
      "/waves/wave-123?serialNo=42"
    );
  });

  it("includes serialNo as string in URL", async () => {
    globalThis.history.replaceState(null, "", "http://localhost/waves");
    (usePathname as jest.Mock).mockReturnValue("/waves");

    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");

    const { result } = renderHook(() => useActiveWaveManager());

    act(() => {
      result.current.setActiveWave("wave-xyz", { serialNo: "99" });
    });
    expect(pushStateSpy).toHaveBeenLastCalledWith(
      null,
      "",
      "/waves/wave-xyz?serialNo=99"
    );
  });
});
