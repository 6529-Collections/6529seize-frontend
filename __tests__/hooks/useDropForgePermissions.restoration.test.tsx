import { renderHook } from "@testing-library/react";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
let mockConnectionState = "initializing";
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ connectionState: mockConnectionState }),
}));
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({ seizeSettings: {}, isLoaded: true }),
}));
jest.mock("@/hooks/useIsDropForgeAdmin", () => ({
  useIsDropForgeAdmin: () => ({ isDropForgeAdmin: false, isFetching: false }),
}));
it.each(["initializing", "connecting"])(
  "keeps Drop Forge checking permissions during %s",
  (state) => {
    mockConnectionState = state;
    const { result, rerender } = renderHook(() => useDropForgePermissions());
    expect(result.current.permissionsLoading).toBe(true);
    expect(result.current.canAccessLanding).toBe(false);
    mockConnectionState = "disconnected";
    rerender();
    expect(result.current.permissionsLoading).toBe(false);
  }
);
