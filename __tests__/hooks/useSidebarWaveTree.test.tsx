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
  const getTreeRowKeys = (
    rows: ReturnType<ReturnType<typeof useSidebarWaveTree>["getRows"]>
  ) => rows.map((row) => row.key);

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
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual(["parent", "parent:subwaves-toggle"]);

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(onParentExpand).toHaveBeenCalledWith("parent");

    const expandedRows = result.current.getRows(result.current.topLevelWaves);

    expect(getTreeRowKeys(expandedRows)).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:older-child",
      "parent:newer-child",
    ]);
    expect(expandedRows[0]).toMatchObject({
      canExpand: true,
      isExpanded: true,
    });
    expect(expandedRows[1]).toMatchObject({
      rowType: "subwaves-toggle",
      depth: 1,
      isExpanded: true,
      knownSubwavesCount: 2,
      unreadSubwaveDropsCount: 0,
    });
    expect(expandedRows[2]).toMatchObject({
      depth: 1,
      canExpand: false,
      isFirstSubwave: true,
      isLastSubwave: false,
    });
    expect(expandedRows[3]).toMatchObject({
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
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual(["parent", "parent:subwaves-toggle"]);
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
      getTreeRowKeys(
        firstRender.result.current.getRows(
          firstRender.result.current.topLevelWaves
        )
      )
    ).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:older-child",
      "parent:newer-child",
    ]);

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
      getTreeRowKeys(
        secondRender.result.current.getRows(
          secondRender.result.current.topLevelWaves
        )
      )
    ).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:older-child",
      "parent:newer-child",
    ]);
    expect(secondOnParentExpand).not.toHaveBeenCalled();
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
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual(["parent", "parent:subwaves-toggle", "parent:child"]);

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

    expect(getTreeRowKeys(restoredRows)).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:child",
    ]);
    expect(restoredRows[0]).toMatchObject({
      isExpanded: true,
    });
  });

  it("keeps parent unread metadata separate from unread subwave metadata", () => {
    const wavesWithParentAndSubwaveUnread = [
      createMockMinimalWave({
        id: "parent",
        hasSubwaves: true,
        unreadDropsCount: 2,
        unreadFollowedSubwaveDrops: 7,
      }),
      createMockMinimalWave({
        id: "child",
        parentWaveId: "parent",
        unreadDropsCount: 9,
      }),
    ];
    const { result } = renderHook(() =>
      useSidebarWaveTree({
        waves: wavesWithParentAndSubwaveUnread,
        activeWaveId: null,
      })
    );

    const rows = result.current.getRows(result.current.topLevelWaves);

    expect(rows[0]).toMatchObject({
      rowType: "wave",
      unreadSubwaveDropsCount: 7,
      wave: expect.objectContaining({
        unreadDropsCount: 2,
      }),
    });
    expect(rows[1]).toMatchObject({
      rowType: "subwaves-toggle",
      hasUnreadSubwaves: true,
      unreadSubwaveDropsCount: 7,
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

    expect(getTreeRowKeys(rows)).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:older-child",
      "parent:newer-child",
    ]);
    expect(onParentExpand).not.toHaveBeenCalled();
    expect(
      globalThis.sessionStorage.getItem("sidebar-wave-tree-expansion-v1")
    ).toBeNull();
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

    expect(firstOnParentExpand).not.toHaveBeenCalled();

    rerender({ onParentExpand: secondOnParentExpand });

    expect(secondOnParentExpand).not.toHaveBeenCalled();
    expect(
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:older-child",
      "parent:newer-child",
    ]);
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
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:older-child",
      "parent:newer-child",
    ]);
    expect(onParentExpand).not.toHaveBeenCalled();

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual(["parent", "parent:subwaves-toggle"]);
    expect(onParentExpand).not.toHaveBeenCalled();
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
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual(["parent", "parent:subwaves-toggle"]);

    act(() => {
      result.current.toggleParent("parent");
    });

    expect(
      getTreeRowKeys(result.current.getRows(result.current.topLevelWaves))
    ).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:older-child",
      "parent:newer-child",
    ]);
    expect(onParentExpand).toHaveBeenCalledTimes(1);
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

    expect(onParentExpand).not.toHaveBeenCalled();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      wave: expect.objectContaining({ id: "parent" }),
      isExpanded: false,
    });
    expect(rows[1]).toMatchObject({
      rowType: "subwaves-toggle",
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

    expect(getTreeRowKeys(loadedRows)).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:direct-child",
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

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      canExpand: true,
      hasUnreadSubwaves: true,
      isExpanded: false,
    });
    expect(rows[1]).toMatchObject({
      rowType: "subwaves-toggle",
      unreadSubwaveDropsCount: 2,
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
    expect(rows[1]).toMatchObject({
      rowType: "subwaves-toggle",
      unreadSubwaveDropsCount: 0,
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

    expect(loadingRows).toHaveLength(2);
    expect(loadingRows[0]).toMatchObject({
      wave: expect.objectContaining({ id: "parent" }),
      isExpanded: false,
      isLoadingSubwaves: true,
    });
    expect(loadingRows[1]).toMatchObject({
      rowType: "subwaves-toggle",
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

    expect(getTreeRowKeys(loadedRows)).toEqual([
      "parent",
      "parent:subwaves-toggle",
      "parent:child",
    ]);
    expect(loadedRows[0]).toMatchObject({
      isExpanded: true,
      isLoadingSubwaves: false,
    });
  });
});
