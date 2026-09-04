import { renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { useRevealActiveSidebarWave } from "@/hooks/useRevealActiveSidebarWave";
import type { SidebarWaveTreeRow } from "@/hooks/useSidebarWaveTree";

const createWaveRow = (
  waveId: string,
  parentWaveId: string | null = null
): SidebarWaveTreeRow => ({
  key: parentWaveId === null ? waveId : `${parentWaveId}:${waveId}`,
  rowType: "wave",
  wave: createMockMinimalWave({ id: waveId, parentWaveId }),
  depth: parentWaveId === null ? 0 : 1,
  parentWaveId,
  isExpanded: false,
  isLoadingSubwaves: false,
  canExpand: false,
  hasUnreadSubwaves: false,
  knownSubwavesCount: null,
  unreadSubwaveDropsCount: 0,
  isFirstSubwave: false,
  isLastSubwave: false,
});

describe("useRevealActiveSidebarWave", () => {
  it("reveals the parent while loading and then the active subwave", () => {
    const parentRow = createWaveRow("parent");
    const childRow = createWaveRow("child", "parent");
    const scrollToVirtualIndex = jest.fn(() => true);
    const scrollContainerRef = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLElement>;
    const { rerender } = renderHook(
      ({ virtualRows }: { readonly virtualRows: SidebarWaveTreeRow[] }) =>
        useRevealActiveSidebarWave({
          activeParentWaveId: "parent",
          activeWaveId: "child",
          scrollContainerRef,
          scrollToVirtualIndex,
          staticRows: [],
          virtualRows,
        }),
      { initialProps: { virtualRows: [parentRow] } }
    );

    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(0);

    rerender({ virtualRows: [parentRow, childRow] });

    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(2);
  });

  it("reveals active rows rendered in a static section", () => {
    const container = document.createElement("div");
    const rowElement = document.createElement("div");
    const scrollIntoView = jest.fn();
    rowElement.dataset["sidebarWaveId"] = "active-pinned";
    rowElement.scrollIntoView = scrollIntoView;
    container.append(rowElement);

    renderHook(() =>
      useRevealActiveSidebarWave({
        activeParentWaveId: null,
        activeWaveId: "active-pinned",
        scrollContainerRef: { current: container },
        scrollToVirtualIndex: jest.fn(() => true),
        staticRows: [[createWaveRow("active-pinned")]],
        virtualRows: [],
      })
    );

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("reveals the active row again when hydrated rows move its position", () => {
    const activeRow = createWaveRow("active");
    const scrollToVirtualIndex = jest.fn(() => true);
    const scrollContainerRef = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLElement>;
    const { rerender } = renderHook(
      ({ virtualRows }: { readonly virtualRows: SidebarWaveTreeRow[] }) =>
        useRevealActiveSidebarWave({
          activeParentWaveId: null,
          activeWaveId: "active",
          scrollContainerRef,
          scrollToVirtualIndex,
          staticRows: [],
          virtualRows,
        }),
      { initialProps: { virtualRows: [activeRow] } }
    );

    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(0);

    rerender({ virtualRows: [createWaveRow("newer"), activeRow] });

    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(2);
  });
});
