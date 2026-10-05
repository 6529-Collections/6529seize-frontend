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
