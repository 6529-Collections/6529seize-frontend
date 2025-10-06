import { renderHook, act } from "@testing-library/react";
import { usePinnedWaves, MAX_PINNED_WAVES } from "@/hooks/usePinnedWaves";

it("adds and removes ids and persists to localStorage", () => {
  const { result } = renderHook(() => usePinnedWaves());

  act(() => {
    result.current.addId("1");
    result.current.addId("2");
  });

  expect(result.current.pinnedIds).toEqual(["2", "1"]);
  expect(JSON.parse(localStorage.getItem("pinnedWave") || "[]")).toEqual([
    "2",
    "1",
  ]);

  act(() => {
    result.current.removeId("2");
  });
  expect(result.current.pinnedIds).toEqual(["1"]);
});

it("limits number of pinned ids", () => {
  const { result } = renderHook(() => usePinnedWaves());
  act(() => {
    for (let i = 0; i < MAX_PINNED_WAVES + 2; i++) {
      result.current.addId(String(i));
    }
  });
  expect(result.current.pinnedIds.length).toBe(MAX_PINNED_WAVES);
});
