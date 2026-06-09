import { act, renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { useSidebarWaveTree } from "@/hooks/useSidebarWaveTree";

describe("useSidebarWaveTree", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const waves = [
    createMockMinimalWave({
      id: "parent",
      hasSubwaves: true,
    }),
    createMockMinimalWave({
      id: "newer-child",
      parentWaveId: "parent",
      createdAt: 20,
    }),
    createMockMinimalWave({
      id: "older-child",
      parentWaveId: "parent",
      hasSubwaves: true,
      createdAt: 10,
    }),
  ];

  it("keeps manual expansion in memory and sorts expanded subwaves by created time", () => {
    const onParentExpand = jest.fn();
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: null,
        onParentExpand,
      })
    );

    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent"]);

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(onParentExpand).toHaveBeenCalledWith("parent");

    const expandedRows = result.current.getRows(result.current.topLevelWaves);

    expect(expandedRows.map((row) => row.wave.id)).toEqual([
      "parent",
      "older-child",
      "newer-child",
    ]);
    expect(expandedRows[0]).toMatchObject({
      canExpand: true,
      isExpanded: true,
    });
    expect(expandedRows[1]).toMatchObject({ depth: 1, canExpand: false });

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(onParentExpand).toHaveBeenCalledTimes(1);
    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent"]);
  });

  it("can hide expanded child rows without clearing expansion state", () => {
    const onParentExpand = jest.fn();
    const wavesWithUnreadSubwave = [
      createMockMinimalWave({
        id: "parent",
        hasSubwaves: true,
      }),
      createMockMinimalWave({
        id: "child",
        parentWaveId: "parent",
        createdAt: 10,
        unreadDropsCount: 1,
      }),
    ];
    const { result, rerender } = renderHook(
      ({ showExpandedSubwaves }: { readonly showExpandedSubwaves: boolean }) =>
        useSidebarWaveTree({
          waves: wavesWithUnreadSubwave,
          activeWaveId: null,
          onParentExpand,
          showExpandedSubwaves,
        }),
      {
        initialProps: {
          showExpandedSubwaves: true,
        },
      }
    );

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent", "child"]);

    rerender({ showExpandedSubwaves: false });

    const hiddenRows = result.current.getRows(result.current.topLevelWaves);

    expect(hiddenRows.map((row) => row.wave.id)).toEqual(["parent"]);
    expect(hiddenRows[0]).toMatchObject({
      canExpand: true,
      isExpanded: false,
      hasUnreadSubwaves: true,
    });

    rerender({ showExpandedSubwaves: true });

    const restoredRows = result.current.getRows(result.current.topLevelWaves);

    expect(restoredRows.map((row) => row.wave.id)).toEqual([
      "parent",
      "child",
    ]);
    expect(restoredRows[0]).toMatchObject({
      isExpanded: true,
    });
  });

  it("auto-expands the active subwave parent without local storage", () => {
    const onParentExpand = jest.fn();
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: "older-child",
        onParentExpand,
      })
    );

    const rows = result.current.getRows(result.current.topLevelWaves);

    expect(rows.map((row) => row.wave.id)).toEqual([
      "parent",
      "older-child",
      "newer-child",
    ]);
    expect(onParentExpand).toHaveBeenCalledWith("parent");
    expect(window.localStorage.length).toBe(0);
  });

  it("loads a direct active subwave parent before the child is in the list", () => {
    const onParentExpand = jest.fn();
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves: [waves[0]!],
        activeWaveId: "direct-child",
        activeParentWaveId: "parent",
        onParentExpand,
      })
    );

    const rows = result.current.getRows(result.current.topLevelWaves);

    expect(onParentExpand).toHaveBeenCalledWith("parent");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      wave: expect.objectContaining({ id: "parent" }),
      isExpanded: true,
    });
  });
});
