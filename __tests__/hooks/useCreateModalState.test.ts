import { act, renderHook } from "@testing-library/react";
import useCreateModalState from "@/hooks/useCreateModalState";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const push = jest.fn();
const replace = jest.fn();

describe("useCreateModalState", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    push.mockClear();
    replace.mockClear();
    globalThis.history.replaceState(null, "", "/waves");
    (useRouter as jest.Mock).mockReturnValue({ push, replace });
    (usePathname as jest.Mock).mockImplementation(
      () => globalThis.window.location.pathname
    );
    (useSearchParams as jest.Mock).mockImplementation(
      () => new URLSearchParams(globalThis.window.location.search)
    );
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.history.replaceState(null, "", "/");
  });

  it("opens wave create with pushState and keeps existing params", () => {
    globalThis.history.replaceState(null, "", "/waves?view=following&drop=d1");
    const pushState = jest.spyOn(globalThis.history, "pushState");

    const { result } = renderHook(() => useCreateModalState());

    act(() => {
      result.current.openWave();
    });

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      "/waves?view=following&drop=d1&create=wave"
    );
    expect(result.current.isWaveModalOpen).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it("opens direct-message create with pushState and keeps existing params", () => {
    globalThis.history.replaceState(null, "", "/messages?view=inbox");
    const pushState = jest.spyOn(globalThis.history, "pushState");

    const { result } = renderHook(() => useCreateModalState());

    act(() => {
      result.current.openDirectMessage();
    });

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      "/messages?view=inbox&create=dm"
    );
    expect(result.current.isDirectMessageModalOpen).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it("closes with replaceState and removes only create", () => {
    globalThis.history.replaceState(
      null,
      "",
      "/waves?view=following&create=wave&drop=d1"
    );
    const replaceState = jest.spyOn(globalThis.history, "replaceState");

    const { result } = renderHook(() => useCreateModalState());
    expect(result.current.isWaveModalOpen).toBe(true);

    replaceState.mockClear();
    act(() => {
      result.current.close();
    });

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/waves?view=following&drop=d1"
    );
    expect(result.current.isWaveModalOpen).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });

  it("updates from popstate so browser Back closes the modal", () => {
    globalThis.history.replaceState(null, "", "/waves?view=following");
    const { result } = renderHook(() => useCreateModalState());

    act(() => {
      result.current.openWave();
    });
    expect(result.current.isWaveModalOpen).toBe(true);

    act(() => {
      globalThis.history.replaceState(null, "", "/waves?view=following");
      globalThis.window.dispatchEvent(
        new globalThis.window.PopStateEvent("popstate")
      );
    });

    expect(result.current.isWaveModalOpen).toBe(false);
  });

  it("keeps app mode on create routes", () => {
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: true });
    const pushState = jest.spyOn(globalThis.history, "pushState");

    const { result } = renderHook(() => useCreateModalState());

    act(() => {
      result.current.openWave();
    });
    act(() => {
      result.current.openDirectMessage();
    });

    expect(push).toHaveBeenCalledWith("/waves/create");
    expect(push).toHaveBeenCalledWith("/messages/create");
    expect(pushState).not.toHaveBeenCalled();
  });
});
