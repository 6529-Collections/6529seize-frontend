import { act, renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import {
  SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS,
  useAnimatedSidebarWaveRows,
} from "@/hooks/useAnimatedSidebarWaveRows";
import type { SidebarWaveTreeRow } from "@/hooks/useSidebarWaveTree";

const parentWave = createMockMinimalWave({
  id: "parent",
  hasSubwaves: true,
});
const childWave = createMockMinimalWave({
  id: "child",
  parentWaveId: "parent",
});

const expandedRows: SidebarWaveTreeRow[] = [
  {
    key: "parent",
    wave: parentWave,
    depth: 0,
    parentWaveId: null,
    isExpanded: true,
    canExpand: true,
    hasUnreadSubwaves: false,
    isFirstSubwave: false,
    isLastSubwave: false,
  },
  {
    key: "parent:child",
    wave: childWave,
    depth: 1,
    parentWaveId: "parent",
    isExpanded: false,
    canExpand: false,
    hasUnreadSubwaves: false,
    isFirstSubwave: true,
    isLastSubwave: true,
  },
];

const parentOnlyRows: SidebarWaveTreeRow[] = [
  {
    ...expandedRows[0]!,
    isExpanded: false,
  },
];

const flushAnimatedRowsEffect = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const advanceAnimationTimers = async (time: number) => {
  await act(async () => {
    jest.advanceTimersByTime(time);
    await Promise.resolve();
  });
};

describe("useAnimatedSidebarWaveRows", () => {
  it("returns rows during the first non-empty render", () => {
    const renderSnapshots: {
      readonly keys: string[];
      readonly states: string[];
    }[] = [];
    const { rerender, result } = renderHook(
      ({ rows }: { readonly rows: SidebarWaveTreeRow[] }) => {
        const animatedRows = useAnimatedSidebarWaveRows(rows);
        renderSnapshots.push({
          keys: animatedRows.map((row) => row.key),
          states: animatedRows.map((row) => row.animationState),
        });
        return animatedRows;
      },
      {
        initialProps: {
          rows: [],
        },
      }
    );

    renderSnapshots.length = 0;
    rerender({ rows: expandedRows });

    expect(renderSnapshots[0]).toEqual({
      keys: ["parent", "parent:child"],
      states: ["entered", "entered"],
    });
    expect(result.current.map((row) => row.key)).toEqual([
      "parent",
      "parent:child",
    ]);
    expect(result.current.map((row) => row.animationState)).toEqual([
      "entered",
      "entered",
    ]);
  });

  it("keeps exiting child rows by default until the transition timer finishes", async () => {
    jest.useFakeTimers();

    try {
      const { result, rerender } = renderHook(
        ({ rows }: { readonly rows: SidebarWaveTreeRow[] }) =>
          useAnimatedSidebarWaveRows(rows),
        {
          initialProps: {
            rows: expandedRows,
          },
        }
      );

      rerender({ rows: parentOnlyRows });
      await flushAnimatedRowsEffect();

      expect(result.current.map((row) => row.key)).toEqual([
        "parent",
        "parent:child",
      ]);
      expect(result.current[1]).toMatchObject({
        key: "parent:child",
        animationState: "exiting",
      });

      await advanceAnimationTimers(SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS);

      expect(result.current.map((row) => row.key)).toEqual(["parent"]);
    } finally {
      jest.useRealTimers();
    }
  });

  it("removes child rows immediately when exiting rows are disabled", () => {
    const { result, rerender } = renderHook(
      ({
        rows,
        keepExitingRows,
      }: {
        readonly rows: SidebarWaveTreeRow[];
        readonly keepExitingRows: boolean;
      }) => useAnimatedSidebarWaveRows(rows, { keepExitingRows }),
      {
        initialProps: {
          rows: expandedRows,
          keepExitingRows: false,
        },
      }
    );

    rerender({
      rows: parentOnlyRows,
      keepExitingRows: false,
    });

    expect(result.current.map((row) => row.key)).toEqual(["parent"]);
  });

  it("settles quick close and reopen cycles without stale animation state", async () => {
    jest.useFakeTimers();

    try {
      const { result, rerender } = renderHook(
        ({ rows }: { readonly rows: SidebarWaveTreeRow[] }) =>
          useAnimatedSidebarWaveRows(rows),
        {
          initialProps: {
            rows: parentOnlyRows,
          },
        }
      );

      rerender({ rows: expandedRows });
      await flushAnimatedRowsEffect();
      expect(result.current[1]).toMatchObject({
        key: "parent:child",
        animationState: "entering",
      });

      rerender({ rows: parentOnlyRows });
      await flushAnimatedRowsEffect();
      expect(result.current[1]).toMatchObject({
        key: "parent:child",
        animationState: "exiting",
      });

      rerender({ rows: expandedRows });
      await flushAnimatedRowsEffect();
      expect(result.current[1]).toMatchObject({
        key: "parent:child",
        animationState: "entering",
      });

      await advanceAnimationTimers(40);

      expect(result.current.map((row) => row.key)).toEqual([
        "parent",
        "parent:child",
      ]);
      expect(result.current.map((row) => row.animationState)).toEqual([
        "entered",
        "entered",
      ]);

      await advanceAnimationTimers(SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS);

      expect(result.current.map((row) => row.key)).toEqual([
        "parent",
        "parent:child",
      ]);
      expect(result.current.map((row) => row.animationState)).toEqual([
        "entered",
        "entered",
      ]);
    } finally {
      jest.useRealTimers();
    }
  });
});
