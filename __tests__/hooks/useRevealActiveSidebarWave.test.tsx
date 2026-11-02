import { fireEvent, renderHook } from "@testing-library/react";
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
  it("does not reveal the same wave again when incoming activity reorders it", () => {
    const activeRow = createWaveRow("active");
    const otherRow = createWaveRow("other");
    const scrollToVirtualIndex = jest.fn(() => true);
    const scrollContainerRef = { current: document.createElement("div") };
    const { rerender } = renderHook(
      ({ virtualRows }) =>
        useRevealActiveSidebarWave({
          activeParentWaveId: null,
          activeWaveId: "active",
          scrollContainerRef,
          scrollToVirtualIndex,
          staticRows: [],
          virtualRows,
        }),
      { initialProps: { virtualRows: [otherRow, activeRow] } }
    );
    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
    rerender({ virtualRows: [activeRow, otherRow] });
    rerender({ virtualRows: [otherRow, activeRow] });
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(1);
  });

  it("keeps reader input in control while the initial list is still loading", () => {
    const activeRow = createWaveRow("active");
    const scrollToVirtualIndex = jest.fn(() => true);
    const scrollContainerRef = { current: document.createElement("div") };
    const { rerender } = renderHook(
      ({ isLoading }) =>
        useRevealActiveSidebarWave({
          activeParentWaveId: null,
          activeWaveId: "active",
          isLoading,
          scrollContainerRef,
          scrollToVirtualIndex,
          staticRows: [],
          virtualRows: [activeRow],
        }),
      { initialProps: { isLoading: true } }
    );
    fireEvent.wheel(scrollContainerRef.current);
    rerender({ isLoading: false });
    expect(scrollToVirtualIndex).not.toHaveBeenCalled();
  });

  it.each(["wheel", "touchStart", "pointerDown", "keyDown"] as const)(
    "stops activity-driven reveals after %s and resumes on navigation",
    (event) => {
      const activeRow = createWaveRow("active");
      const nextRow = createWaveRow("next");
      const scrollToVirtualIndex = jest.fn(() => true);
      const scrollContainerRef = { current: document.createElement("div") };
      const { rerender } = renderHook(
        ({ activeWaveId, virtualRows }) =>
          useRevealActiveSidebarWave({
            activeParentWaveId: null,
            activeWaveId,
            scrollContainerRef,
            scrollToVirtualIndex,
            staticRows: [],
            virtualRows,
          }),
        {
          initialProps: {
            activeWaveId: "active",
            virtualRows: [activeRow, nextRow],
          },
        }
      );
      fireEvent[event](scrollContainerRef.current);
      rerender({ activeWaveId: "active", virtualRows: [nextRow, activeRow] });
      rerender({ activeWaveId: "active", virtualRows: [activeRow, nextRow] });
      expect(scrollToVirtualIndex).toHaveBeenCalledTimes(1);

      rerender({ activeWaveId: "next", virtualRows: [activeRow, nextRow] });
      expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
      expect(scrollToVirtualIndex).toHaveBeenCalledTimes(2);
    }
  );

  it("keeps direct-message reveals when interaction preservation is disabled", () => {
    const activeRow = createWaveRow("active");
    const scrollToVirtualIndex = jest.fn(() => true);
    const scrollContainerRef = { current: document.createElement("div") };
    const { rerender } = renderHook(
      ({ virtualRows }) =>
        useRevealActiveSidebarWave({
          activeParentWaveId: null,
          activeWaveId: "active",
          preserveScrollOnInteraction: false,
          scrollContainerRef,
          scrollToVirtualIndex,
          staticRows: [],
          virtualRows,
        }),
      { initialProps: { virtualRows: [activeRow] } }
    );
    fireEvent.wheel(scrollContainerRef.current);
    rerender({ virtualRows: [createWaveRow("newer"), activeRow] });
    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(2);
  });

  it("does not cancel delayed hydration for a programmatic scroll", () => {
    const parent = createWaveRow("parent");
    const scrollToVirtualIndex = jest.fn(() => true);
    const scrollContainerRef = { current: document.createElement("div") };
    const { rerender } = renderHook(
      ({ virtualRows }) =>
        useRevealActiveSidebarWave({
          activeParentWaveId: "parent",
          activeWaveId: "child",
          scrollContainerRef,
          scrollToVirtualIndex,
          staticRows: [],
          virtualRows,
        }),
      { initialProps: { virtualRows: [parent] } }
    );
    fireEvent.scroll(scrollContainerRef.current);
    rerender({ virtualRows: [parent, createWaveRow("child", "parent")] });
    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])(
    "preserves scroll across filter changes and resumes on navigation (empty Joined: %s)",
    (emptyJoined) => {
      const activeRow = createWaveRow("active");
      const nextRow = createWaveRow("next");
      const scrollToVirtualIndex = jest.fn(() => true);
      const scrollContainerRef = { current: document.createElement("div") };
      const { rerender } = renderHook(
        ({ activeWaveId, filterKey, virtualRows }) =>
          useRevealActiveSidebarWave({
            activeParentWaveId: null,
            activeWaveId,
            filterKey,
            scrollContainerRef,
            scrollToVirtualIndex,
            staticRows: [],
            virtualRows,
          }),
        {
          initialProps: {
            activeWaveId: "active",
            filterKey: "all",
            virtualRows: [createWaveRow("newer"), activeRow],
          },
        }
      );

      expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
      rerender({
        activeWaveId: "active",
        filterKey: "joined",
        virtualRows: emptyJoined ? [] : [activeRow],
      });
      rerender({
        activeWaveId: "active",
        filterKey: "all",
        virtualRows: [activeRow],
      });
      rerender({
        activeWaveId: "active",
        filterKey: "all",
        virtualRows: [nextRow, activeRow],
      });
      expect(scrollToVirtualIndex).toHaveBeenCalledTimes(1);

      rerender({
        activeWaveId: "next",
        filterKey: "all",
        virtualRows: [nextRow, activeRow],
      });
      expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(0);
      expect(scrollToVirtualIndex).toHaveBeenCalledTimes(2);
    }
  );

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

  it("waits for list hydration before revealing the active row at its final position", () => {
    const activeRow = createWaveRow("active");
    const scrollToVirtualIndex = jest.fn(() => true);
    const scrollContainerRef = {
      current: document.createElement("div"),
    } as React.RefObject<HTMLElement>;
    const { rerender } = renderHook(
      ({ virtualRows, isLoading }) =>
        useRevealActiveSidebarWave({
          activeParentWaveId: null,
          activeWaveId: "active",
          isLoading,
          scrollContainerRef,
          scrollToVirtualIndex,
          staticRows: [],
          virtualRows,
        }),
      { initialProps: { virtualRows: [activeRow], isLoading: true } }
    );

    expect(scrollToVirtualIndex).not.toHaveBeenCalled();
    rerender({
      virtualRows: [createWaveRow("newer"), activeRow],
      isLoading: true,
    });
    expect(scrollToVirtualIndex).not.toHaveBeenCalled();
    rerender({
      virtualRows: [createWaveRow("newer"), activeRow],
      isLoading: false,
    });

    expect(scrollToVirtualIndex).toHaveBeenLastCalledWith(1);
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(1);
    // A later refetch or page must not restart the navigation reveal.
    rerender({ virtualRows: [activeRow], isLoading: true });
    rerender({ virtualRows: [activeRow], isLoading: false });
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(1);

    // Keep the completed reveal even if a reload temporarily removes all rows.
    rerender({ virtualRows: [], isLoading: true });
    rerender({ virtualRows: [activeRow], isLoading: false });
    expect(scrollToVirtualIndex).toHaveBeenCalledTimes(1);
  });
});
