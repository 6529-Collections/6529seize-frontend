import { renderHook, act, waitFor } from "@testing-library/react";
import { useActiveWaveManager } from "@/contexts/wave/hooks/useActiveWaveManager";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { defaultCompetitionQueryKey } from "@/services/api/competitions-api";

const mockQueryData = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ getQueryData: mockQueryData }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "member:self",
}));
jest.mock("@/helpers/competition.helpers", () => ({
  ...jest.requireActual("@/helpers/competition.helpers"),
  isMultiCompetitionEnabled: () => true,
}));

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
  useSearchParams: jest.fn(),
}));

describe("useActiveWaveManager", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    mockQueryData.mockReset();
    globalThis.history.replaceState(null, "", "http://localhost/");
  });

  it("reads wave from pathname and updates via setActiveWave", async () => {
    globalThis.history.replaceState(null, "", "http://localhost/waves/abc");
    (usePathname as jest.Mock).mockReturnValue("/waves/abc");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams({}));

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
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams({}));
    rerender();
    await waitFor(() => expect(result.current.activeWaveId).toBe("def"));

    pushStateSpy.mockClear();
    act(() => {
      result.current.setActiveWave(null);
    });
    expect(pushStateSpy).toHaveBeenLastCalledWith(null, "", "/waves");
  });

  it("includes serialNo when provided via options", async () => {
    globalThis.history.replaceState(null, "", "http://localhost/waves");
    (usePathname as jest.Mock).mockReturnValue("/waves");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams({}));

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

  it.each([
    "/waves/abc/competitions",
    "/waves/abc/competitions/competition-1",
    "/waves/abc/competitions/new",
    "/waves/abc/competitions/competition-1?edit=1",
  ])("uses route navigation when switching waves from %s", (source) => {
    globalThis.history.replaceState(null, "", source);
    (usePathname as jest.Mock).mockReturnValue(source.split("?")[0]);
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams(globalThis.location.search)
    );
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");
    const { result } = renderHook(() => useActiveWaveManager());

    act(() => {
      result.current.setActiveWave("def", { divider: 42 });
    });

    expect(push).toHaveBeenCalledWith("/waves/def?divider=42");
    expect(pushStateSpy).not.toHaveBeenCalled();
    // Keep the visible source wave until the route-owned destination commits.
    expect(result.current.activeWaveId).toBe("abc");
  });

  it("uses route navigation when deselecting a wave from competitions", () => {
    globalThis.history.replaceState(null, "", "/waves/abc/competitions");
    (usePathname as jest.Mock).mockReturnValue("/waves/abc/competitions");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");
    const { result } = renderHook(() => useActiveWaveManager());

    act(() => {
      result.current.setActiveWave(null);
    });

    expect(push).toHaveBeenCalledWith("/waves");
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it("includes serialNo as string in URL", async () => {
    globalThis.history.replaceState(null, "", "http://localhost/waves");
    (usePathname as jest.Mock).mockReturnValue("/waves");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams({}));

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

  it("opens a remembered competition directly without changing the visible wave before the route commits", async () => {
    globalThis.history.replaceState(null, "", "/waves/chat");
    (usePathname as jest.Mock).mockReturnValue("/waves/chat");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    localStorage.setItem(
      "memes_wave_last_tab_by_id",
      JSON.stringify({
        stage: { tab: "LEADERBOARD", competitionId: "primary" },
      })
    );
    mockQueryData.mockReturnValue({ competition_id: "primary" });
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");
    const { result, rerender } = renderHook(() => useActiveWaveManager());
    act(() => result.current.setActiveWave("stage", { divider: 42 }));
    expect(mockQueryData).toHaveBeenLastCalledWith(
      defaultCompetitionQueryKey("stage", "member:self")
    );
    expect(push).toHaveBeenCalledWith(
      "/waves/stage/competitions/primary?tab=leaderboard&restore=1&divider=42"
    );
    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(result.current.activeWaveId).toBe("chat");
    globalThis.history.replaceState(
      null,
      "",
      "/waves/stage/competitions/primary?tab=leaderboard&divider=42"
    );
    (usePathname as jest.Mock).mockReturnValue(
      "/waves/stage/competitions/primary"
    );
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("tab=leaderboard&divider=42")
    );
    rerender();
    await waitFor(() => expect(result.current.activeWaveId).toBe("stage"));
  });

  it.each([undefined, { competition_id: "new-default" }])(
    "resolves a remembered competition through its wave when the cached default does not agree (%j)",
    (selection) => {
      globalThis.history.replaceState(null, "", "/waves/chat");
      (usePathname as jest.Mock).mockReturnValue("/waves/chat");
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
      localStorage.setItem(
        "memes_wave_last_tab_by_id",
        JSON.stringify({
          stage: { tab: "LEADERBOARD", competitionId: "primary" },
        })
      );
      mockQueryData.mockReturnValue(selection);
      const pushStateSpy = jest.spyOn(globalThis.history, "pushState");
      const { result } = renderHook(() => useActiveWaveManager());
      act(() => result.current.setActiveWave("stage"));
      expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/waves/stage");
    }
  );

  it("preserves explicit serial-message targets ahead of a remembered competition", () => {
    globalThis.history.replaceState(null, "", "/waves/chat");
    (usePathname as jest.Mock).mockReturnValue("/waves/chat");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    localStorage.setItem(
      "memes_wave_last_tab_by_id",
      JSON.stringify({
        stage: { tab: "LEADERBOARD", competitionId: "primary" },
      })
    );
    mockQueryData.mockReturnValue({ competition_id: "primary" });
    const pushStateSpy = jest.spyOn(globalThis.history, "pushState");
    const { result } = renderHook(() => useActiveWaveManager());
    act(() => result.current.setActiveWave("stage", { serialNo: 9 }));
    expect(pushStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/waves/stage?serialNo=9"
    );
  });
});
