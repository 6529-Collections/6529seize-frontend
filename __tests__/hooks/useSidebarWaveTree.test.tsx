import { act, renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { useSidebarWaveTree } from "@/hooks/useSidebarWaveTree";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

describe("useSidebarWaveTree", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
  });

  const createNewDropsCount = (latestDropTimestamp: number | null) => ({
    count: 0,
    latestDropTimestamp,
    firstUnreadSerialNo: null,
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
      newDropsCount: createNewDropsCount(100),
    }),
    createMockMinimalWave({
      id: "older-child",
      parentWaveId: "parent",
      hasSubwaves: true,
      createdAt: 10,
      newDropsCount: createNewDropsCount(200),
    }),
  ];

  it("keeps manual expansion in memory and sorts expanded subwaves by latest activity", () => {
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
    expect(expandedRows[1]).toMatchObject({
      depth: 1,
      canExpand: false,
      isFirstSubwave: true,
      isLastSubwave: false,
    });
    expect(expandedRows[2]).toMatchObject({
      depth: 1,
      canExpand: false,
      isFirstSubwave: false,
      isLastSubwave: true,
    });

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

  it("restores manually expanded parents after a sidebar remount", () => {
    const firstOnParentExpand = jest.fn();
    const firstRender = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: null,
        onParentExpand: firstOnParentExpand,
      })
    );

    act(() => {
      firstRender.result.current.toggleParent("parent");
    });

    expect(
      firstRender.result.current
        .getRows(firstRender.result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent", "older-child", "newer-child"]);

    firstRender.unmount();

    const secondOnParentExpand = jest.fn();
    const secondRender = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: null,
        onParentExpand: secondOnParentExpand,
      })
    );

    expect(
      secondRender.result.current
        .getRows(secondRender.result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent", "older-child", "newer-child"]);
    expect(secondOnParentExpand).toHaveBeenCalledWith("parent");
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

    expect(restoredRows.map((row) => row.wave.id)).toEqual(["parent", "child"]);
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
    expect(globalThis.localStorage.length).toBe(1);
  });

  it("does not reload the same active parent when the expand callback changes", () => {
    const firstOnParentExpand = jest.fn();
    const secondOnParentExpand = jest.fn();
    const { result, rerender } = renderHook(
      ({
        onParentExpand,
      }: {
        readonly onParentExpand: (parentWaveId: string) => void;
      }) =>
        useSidebarWaveTree({
          waves,
          activeWaveId: "older-child",
          onParentExpand,
        }),
      {
        initialProps: {
          onParentExpand: firstOnParentExpand,
        },
      }
    );

    expect(firstOnParentExpand).toHaveBeenCalledTimes(1);
    expect(firstOnParentExpand).toHaveBeenCalledWith("parent");

    rerender({ onParentExpand: secondOnParentExpand });

    expect(secondOnParentExpand).not.toHaveBeenCalled();
    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent", "older-child", "newer-child"]);
  });

  it("lets manual collapse hide the active subwave parent rows", () => {
    const onParentExpand = jest.fn();
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: "older-child",
        onParentExpand,
      })
    );

    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent", "older-child", "newer-child"]);
    expect(onParentExpand).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent"]);
    expect(onParentExpand).toHaveBeenCalledTimes(1);
  });

  it("reopens a manually collapsed active subwave parent", () => {
    const onParentExpand = jest.fn();
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves,
        activeWaveId: "older-child",
        onParentExpand,
      })
    );

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent"]);

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(
      result.current
        .getRows(result.current.topLevelWaves)
        .map((row) => row.wave.id)
    ).toEqual(["parent", "older-child", "newer-child"]);
    expect(onParentExpand).toHaveBeenCalledTimes(2);
    expect(onParentExpand).toHaveBeenLastCalledWith("parent");
  });

  it("loads a direct active subwave parent without showing it expanded before rows exist", () => {
    const onParentExpand = jest.fn();
    const { result, rerender } = renderHook(
      ({ currentWaves }: { readonly currentWaves: readonly MinimalWave[] }) =>
        useSidebarWaveTree({
          waves: currentWaves,
          activeWaveId: "direct-child",
          activeParentWaveId: "parent",
          onParentExpand,
        }),
      {
        initialProps: {
          currentWaves: [waves[0]!],
        },
      }
    );

    const rows = result.current.getRows(result.current.topLevelWaves);

    expect(onParentExpand).toHaveBeenCalledWith("parent");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      wave: expect.objectContaining({ id: "parent" }),
      isExpanded: false,
    });

    rerender({
      currentWaves: [
        waves[0]!,
        createMockMinimalWave({
          id: "direct-child",
          parentWaveId: "parent",
          createdAt: 30,
        }),
      ],
    });

    const loadedRows = result.current.getRows(result.current.topLevelWaves);

    expect(loadedRows.map((row) => row.wave.id)).toEqual([
      "parent",
      "direct-child",
    ]);
    expect(loadedRows[0]).toMatchObject({
      isExpanded: true,
    });
  });

  it("makes followed-subwave parent containers expandable before child rows load", () => {
    const parentContainer = createMockMinimalWave({
      id: "parent-container",
      followedSubwavesCount: 1,
      unreadFollowedSubwaveDrops: 2,
    });
    const onParentExpand = jest.fn();
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves: [parentContainer],
        activeWaveId: null,
        onParentExpand,
      })
    );

    let rows = result.current.getRows(result.current.topLevelWaves);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      canExpand: true,
      hasUnreadSubwaves: true,
      isExpanded: false,
    });

    act(() => {
      result.current.toggleParent("parent-container");
    });

    rows = result.current.getRows(result.current.topLevelWaves);

    expect(onParentExpand).toHaveBeenCalledWith("parent-container");
    expect(rows[0]).toMatchObject({
      canExpand: true,
      isExpanded: false,
    });
  });

  it("does not show followed child unread on a muted parent container", () => {
    const mutedParentContainer = createMockMinimalWave({
      id: "muted-parent-container",
      followedSubwavesCount: 1,
      unreadFollowedSubwaveDrops: 2,
      isMuted: true,
    });
    const unreadChild = createMockMinimalWave({
      id: "unread-child",
      parentWaveId: "muted-parent-container",
      unreadDropsCount: 1,
    });
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves: [mutedParentContainer, unreadChild],
        activeWaveId: null,
      })
    );

    const rows = result.current.getRows(result.current.topLevelWaves);

    expect(rows[0]).toMatchObject({
      canExpand: true,
      hasUnreadSubwaves: false,
    });
  });

  it("marks an expanded parent as loading before child rows are available", () => {
    const onParentExpand = jest.fn();
    const { result, rerender } = renderHook(
      ({
        currentWaves,
        loadingSubwaveParentIds,
      }: {
        readonly currentWaves: readonly MinimalWave[];
        readonly loadingSubwaveParentIds: readonly string[];
      }) =>
        useSidebarWaveTree({
          waves: currentWaves,
          activeWaveId: null,
          loadingSubwaveParentIds,
          onParentExpand,
        }),
      {
        initialProps: {
          currentWaves: [waves[0]!],
          loadingSubwaveParentIds: [],
        },
      }
    );

    act(() => {
      result.current.toggleParent("parent");
    });

    rerender({
      currentWaves: [waves[0]!],
      loadingSubwaveParentIds: ["parent"],
    });

    const loadingRows = result.current.getRows(result.current.topLevelWaves);

    expect(loadingRows).toHaveLength(1);
    expect(loadingRows[0]).toMatchObject({
      wave: expect.objectContaining({ id: "parent" }),
      isExpanded: false,
      isLoadingSubwaves: true,
    });

    rerender({
      currentWaves: [
        waves[0]!,
        createMockMinimalWave({
          id: "child",
          parentWaveId: "parent",
          createdAt: 30,
        }),
      ],
      loadingSubwaveParentIds: [],
    });

    const loadedRows = result.current.getRows(result.current.topLevelWaves);

    expect(loadedRows.map((row) => row.wave.id)).toEqual(["parent", "child"]);
    expect(loadedRows[0]).toMatchObject({
      isExpanded: true,
      isLoadingSubwaves: false,
    });
  });
});
