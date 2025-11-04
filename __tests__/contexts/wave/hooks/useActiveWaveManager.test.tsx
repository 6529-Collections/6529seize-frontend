import { renderHook, act } from "@testing-library/react";
import { useActiveWaveManager } from "@/contexts/wave/hooks/useActiveWaveManager";
import { useRouter, useSearchParams } from "next/navigation";

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

const push = jest.fn();
const router: any = { query: {}, push };
(useRouter as jest.Mock).mockReturnValue(router);

describe("useActiveWaveManager", () => {
  it("reads wave from query and updates via setActiveWave", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ wave: "abc" })
    );
    const { result, rerender } = renderHook(() => useActiveWaveManager());
    expect(result.current.activeWaveId).toBe("abc");

    act(() => {
      result.current.setActiveWave("def");
    });
    expect(push).toHaveBeenLastCalledWith('/waves?wave=def');

    // Simulate router query change to trigger state update
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ wave: "def" })
    );
    rerender();
    expect(result.current.activeWaveId).toBe("def");

    act(() => {
      result.current.setActiveWave(null);
    });
    expect(push).toHaveBeenLastCalledWith('/waves');
  });
});
