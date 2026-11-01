import { useDeviceSigningPrewarm } from "@/hooks/device-signing/useDeviceSigningPrewarm";
import { renderHook } from "@testing-library/react";

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

const mockPrewarm = jest.fn(async () => undefined);
jest.mock("@/lib/device-signing/sign-write", () => ({
  prewarmDeviceSigning: () => mockPrewarm(),
}));

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useDeviceSigningPrewarm", () => {
  beforeEach(() => {
    mockEnabled = true;
    mockPrewarm.mockClear();
  });

  it("warms on mount, when the tab becomes visible and on composer focus", () => {
    const { result, unmount } = renderHook(() => useDeviceSigningPrewarm());
    expect(mockPrewarm).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    expect(mockPrewarm).toHaveBeenCalledTimes(1);
    setVisibility("visible");
    expect(mockPrewarm).toHaveBeenCalledTimes(2);

    result.current();
    expect(mockPrewarm).toHaveBeenCalledTimes(3);

    unmount();
    setVisibility("visible");
    expect(mockPrewarm).toHaveBeenCalledTimes(3);
  });

  it("does nothing while signed messages are off", () => {
    mockEnabled = false;
    const { result } = renderHook(() => useDeviceSigningPrewarm());
    result.current();
    setVisibility("visible");
    expect(mockPrewarm).not.toHaveBeenCalled();
  });
});
