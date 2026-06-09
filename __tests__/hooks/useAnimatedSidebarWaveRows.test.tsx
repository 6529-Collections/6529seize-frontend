import { act, renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import {
  SIDEBAR_SUBWAVE_ROW_TRANSITION_MS,
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
  },
  {
    key: "parent:child",
    wave: childWave,
    depth: 1,
    parentWaveId: "parent",
    isExpanded: false,
    canExpand: false,
    hasUnreadSubwaves: false,
  },
];

const parentOnlyRows: SidebarWaveTreeRow[] = [
  {
    ...expandedRows[0]!,
    isExpanded: false,
  },
];

describe("useAnimatedSidebarWaveRows", () => {
  it("keeps exiting child rows by default until the transition timer finishes", () => {
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

      expect(result.current.map((row) => row.key)).toEqual([
        "parent",
        "parent:child",
      ]);
      expect(result.current[1]).toMatchObject({
        key: "parent:child",
        animationState: "exiting",
      });

      act(() => {
        jest.advanceTimersByTime(SIDEBAR_SUBWAVE_ROW_TRANSITION_MS);
      });

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
});
