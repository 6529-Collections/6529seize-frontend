import { renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { useSidebarWaveTree } from "@/hooks/useSidebarWaveTree";

describe("useSidebarWaveTree", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sorts expanded subwaves by created time and blocks nested expand controls", () => {
    window.localStorage.setItem(
      "sidebar_expanded_subwave_parent_ids:alice",
      JSON.stringify(["parent"])
    );

    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves: [
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
        ],
        activeWaveId: null,
        storageScope: "alice",
      })
    );

    const rows = result.current.getRows(result.current.topLevelWaves);

    expect(rows.map((row) => row.wave.id)).toEqual([
      "parent",
      "older-child",
      "newer-child",
    ]);
    expect(rows[0]).toMatchObject({ canExpand: true, isExpanded: true });
    expect(rows[1]).toMatchObject({ depth: 1, canExpand: false });
  });
});
