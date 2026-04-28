import { renderHook, act } from "@testing-library/react";
import {
  type PinnedWaveSnapshot,
  usePinnedWaves,
} from "@/hooks/usePinnedWaves";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const MAX_PINNED_WAVES = 20;

const baseWave = (
  overrides: Partial<PinnedWaveSnapshot> = {}
): PinnedWaveSnapshot => ({
  id: "1",
  name: "Wave 1",
  picture: null,
  contributors: [],
  isDirectMessage: false,
  type: ApiWaveType.Chat,
  fetchedAt: 123,
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

it("upserts and removes snapshots and persists to localStorage", () => {
  const { result } = renderHook(() => usePinnedWaves());

  act(() => {
    result.current.upsertWaveSnapshot(baseWave({ id: "1", name: "Wave 1" }), {
      moveToFront: true,
    });
    result.current.upsertWaveSnapshot(baseWave({ id: "2", name: "Wave 2" }), {
      moveToFront: true,
    });
  });

  expect(result.current.pinnedIds).toEqual(["2", "1"]);

  const stored = JSON.parse(
    localStorage.getItem("pinnedWave") ?? "[]"
  ) as PinnedWaveSnapshot[];
  expect(stored.map((wave) => wave.id)).toEqual(["2", "1"]);
  expect(stored[0]).toMatchObject({ id: "2", name: "Wave 2" });

  act(() => {
    result.current.removeId("2");
  });

  expect(result.current.pinnedIds).toEqual(["1"]);
});

it("limits number of pinned snapshots", () => {
  const { result } = renderHook(() => usePinnedWaves());

  act(() => {
    for (let i = 0; i < MAX_PINNED_WAVES + 2; i++) {
      result.current.upsertWaveSnapshot(baseWave({ id: String(i) }), {
        moveToFront: true,
      });
    }
  });

  expect(result.current.pinnedIds.length).toBe(MAX_PINNED_WAVES);
});

it("migrates old string storage to fallback snapshots", () => {
  localStorage.setItem("pinnedWave", JSON.stringify(["1"]));

  const { result } = renderHook(() => usePinnedWaves());

  expect(result.current.pinnedWaves).toEqual([
    {
      id: "1",
      name: null,
      picture: null,
      contributors: [],
      isDirectMessage: false,
      type: null,
      fetchedAt: 0,
    },
  ]);
});

it("migrates old object storage without a wave type", () => {
  localStorage.setItem(
    "pinnedWave",
    JSON.stringify([
      {
        id: "1",
        name: "Wave 1",
        picture: null,
        contributors: [],
        isDirectMessage: false,
        fetchedAt: 123,
      },
    ])
  );

  const { result } = renderHook(() => usePinnedWaves());

  expect(result.current.pinnedWaves[0]).toMatchObject({
    id: "1",
    type: null,
    fetchedAt: 0,
  });
});

it("forces invalid wave type snapshots to refresh", () => {
  localStorage.setItem(
    "pinnedWave",
    JSON.stringify([
      {
        id: "1",
        name: "Wave 1",
        picture: null,
        contributors: [],
        isDirectMessage: false,
        type: "BAD_TYPE",
        fetchedAt: 123,
      },
    ])
  );

  const { result } = renderHook(() => usePinnedWaves());

  expect(result.current.pinnedWaves[0]).toMatchObject({
    id: "1",
    type: null,
    fetchedAt: 0,
  });
});
