import { act, renderHook } from "@testing-library/react";
import {
  getHistoryWaveTab,
  rememberHistoryWaveTab,
  useWaveTabPreference,
  WAVE_TAB_STORAGE_KEY,
} from "@/hooks/useWaveTabPreference";
import { MyStreamWaveTab } from "@/types/waves.types";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/waves/first");
});

it.each([[], { first: "invalid-tab" }, { first: { tab: "LEADERBOARD" } }])(
  "ignores malformed stored preferences (%j)",
  (value) => {
    localStorage.setItem(WAVE_TAB_STORAGE_KEY, JSON.stringify(value));
    const { result } = renderHook(() => useWaveTabPreference());
    expect(result.current.tabs).toEqual({});
  }
);

it("keeps old values and synchronizes deliberate choices between mounted surfaces", () => {
  localStorage.setItem(
    WAVE_TAB_STORAGE_KEY,
    JSON.stringify({ first: MyStreamWaveTab.ABOUT })
  );
  const first = renderHook(() => useWaveTabPreference());
  const second = renderHook(() => useWaveTabPreference());
  act(() => first.result.current.rememberTab("second", MyStreamWaveTab.CHAT));
  act(() =>
    second.result.current.rememberTab(
      "first",
      MyStreamWaveTab.LEADERBOARD,
      "alpha"
    )
  );
  expect(first.result.current.tabs).toEqual({
    first: { tab: MyStreamWaveTab.LEADERBOARD, competitionId: "alpha" },
    second: MyStreamWaveTab.CHAT,
  });
  expect(second.result.current.tabs).toEqual(first.result.current.tabs);
  expect(JSON.parse(localStorage.getItem(WAVE_TAB_STORAGE_KEY)!)).toEqual(
    first.result.current.tabs
  );
});

it("preserves the router's history state and pins the current visit independently", () => {
  const nextState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ["waves"] };
  window.history.replaceState(nextState, "", "/waves/first");
  rememberHistoryWaveTab("first", MyStreamWaveTab.CHAT);
  expect(window.history.state).toMatchObject(nextState);
  expect(getHistoryWaveTab("first")).toBe(MyStreamWaveTab.CHAT);
  expect(getHistoryWaveTab("second")).toBeUndefined();
  rememberHistoryWaveTab("second", MyStreamWaveTab.ABOUT);
  expect(getHistoryWaveTab("first")).toBe(MyStreamWaveTab.CHAT);
});

it("rejects malformed history values", () => {
  window.history.replaceState(
    { waveTabSelection: { waveId: "first", value: { tab: "LEADERBOARD" } } },
    ""
  );
  expect(getHistoryWaveTab("first")).toBeUndefined();
});

it("does not rewrite the same competition preference with reordered keys", () => {
  localStorage.setItem(
    WAVE_TAB_STORAGE_KEY,
    JSON.stringify({
      first: { competitionId: "alpha", tab: MyStreamWaveTab.LEADERBOARD },
    })
  );
  const write = jest.spyOn(Storage.prototype, "setItem");
  try {
    const { result } = renderHook(() => useWaveTabPreference());
    const original = result.current.tabs;
    act(() =>
      result.current.rememberTab("first", MyStreamWaveTab.LEADERBOARD, "alpha")
    );
    expect(result.current.tabs).toBe(original);
    expect(write).not.toHaveBeenCalledWith(
      WAVE_TAB_STORAGE_KEY,
      expect.any(String)
    );
  } finally {
    write.mockRestore();
  }
});

it("scopes a replaced history entry to its new wave", () => {
  rememberHistoryWaveTab("first", MyStreamWaveTab.CHAT);
  window.history.replaceState(window.history.state, "", "/waves/second");
  expect(getHistoryWaveTab("second")).toBeUndefined();
  rememberHistoryWaveTab("first", MyStreamWaveTab.ABOUT);
  expect(getHistoryWaveTab("second")).toBeUndefined();
  rememberHistoryWaveTab("second", MyStreamWaveTab.ABOUT);
  expect(getHistoryWaveTab("second")).toBe(MyStreamWaveTab.ABOUT);
});

it.each([null, undefined])(
  "does not record a missing wave identity (%s)",
  (waveId) => {
    const state = { __NA: true, tree: ["waves"] };
    window.history.replaceState(state, "", "/waves");
    rememberHistoryWaveTab(waveId, MyStreamWaveTab.CHAT);
    expect(window.history.state).toEqual(state);
  }
);
