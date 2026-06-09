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
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: null,
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

    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent"]);
  });

  it("auto-expands the active subwave parent without local storage", () => {
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: "older-child",
      })
    );

    const rows = result.current.getRows(result.current.topLevelWaves);

    expect(rows.map((row) => row.wave.id)).toEqual([
      "parent",
      "older-child",
      "newer-child",
    ]);
    expect(window.localStorage.length).toBe(0);
  });
});
