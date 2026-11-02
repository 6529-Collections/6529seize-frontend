"use client";

import type { SidebarWaveTreeRow } from "@/hooks/useSidebarWaveTree";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";

interface UseRevealActiveSidebarWaveOptions {
  readonly activeParentWaveId: string | null;
  readonly activeWaveId: string | null;
  readonly filterKey?: string;
  readonly isLoading?: boolean;
  readonly preserveScrollOnInteraction?: boolean;
  readonly scrollContainerRef: RefObject<HTMLElement | null>;
  readonly scrollToVirtualIndex: (index: number) => boolean;
  readonly staticRows: readonly (readonly SidebarWaveTreeRow[])[];
  readonly virtualRows: readonly SidebarWaveTreeRow[];
}

const hasWaveRow = (
  rows: readonly SidebarWaveTreeRow[],
  waveId: string | null
) =>
  waveId !== null &&
  rows.some((row) => row.rowType === "wave" && row.wave.id === waveId);

const findWaveRowElement = (
  container: HTMLElement,
  waveId: string
): HTMLElement | null => {
  const rowElements = container.querySelectorAll<HTMLElement>(
    "[data-sidebar-wave-id]"
  );

  return (
    Array.from(rowElements).find(
      (element) => element.dataset["sidebarWaveId"] === waveId
    ) ?? null
  );
};

export function useRevealActiveSidebarWave({
  activeParentWaveId,
  activeWaveId,
  filterKey = "all",
  isLoading = false,
  preserveScrollOnInteraction = true,
  scrollContainerRef,
  scrollToVirtualIndex,
  staticRows,
  virtualRows,
}: UseRevealActiveSidebarWaveOptions) {
  const lastRevealKeyRef = useRef<string | null>(null);
  const revealContextRef = useRef({
    activeWaveId,
    filterKey,
    preserveScroll: false,
  });
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!preserveScrollOnInteraction || container === null) return;

    // Reader input takes over from automatic reveals until another wave opens.
    // Listen to input rather than scroll: our own reveals also dispatch scroll.
    const preserveScroll = () => {
      revealContextRef.current.preserveScroll = true;
    };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    for (const event of events)
      container.addEventListener(event, preserveScroll, { passive: true });
    return () => {
      for (const event of events)
        container.removeEventListener(event, preserveScroll);
    };
  }, [preserveScrollOnInteraction, scrollContainerRef]);
  const staticWaveIds = useMemo(
    () =>
      new Set(
        staticRows.flatMap((rows) =>
          rows.filter((row) => row.rowType === "wave").map((row) => row.wave.id)
        )
      ),
    [staticRows]
  );
  const revealWaveId = useMemo(() => {
    if (hasWaveRow(virtualRows, activeWaveId)) {
      return activeWaveId;
    }

    if (activeWaveId !== null && staticWaveIds.has(activeWaveId)) {
      return activeWaveId;
    }

    if (hasWaveRow(virtualRows, activeParentWaveId)) {
      return activeParentWaveId;
    }

    if (activeParentWaveId !== null && staticWaveIds.has(activeParentWaveId)) {
      return activeParentWaveId;
    }

    return null;
  }, [activeParentWaveId, activeWaveId, staticWaveIds, virtualRows]);
  const virtualRowIndex = useMemo(
    () =>
      revealWaveId === null
        ? -1
        : virtualRows.findIndex(
            (row) => row.rowType === "wave" && row.wave.id === revealWaveId
          ),
    [revealWaveId, virtualRows]
  );

  useLayoutEffect(() => {
    const revealContext = revealContextRef.current;
    if (revealContext.activeWaveId !== activeWaveId) {
      revealContext.activeWaveId = activeWaveId;
      revealContext.preserveScroll = false;
      lastRevealKeyRef.current = null;
    } else if (revealContext.filterKey !== filterKey) {
      revealContext.preserveScroll = true;
    }
    revealContext.filterKey = filterKey;

    // Reader input and filter changes take precedence over automatic reveals,
    // including delayed hydration. Another wave navigation enables them again.
    if (revealContext.preserveScroll) {
      return;
    }

    // Wait for the initial list before revealing a wave once. Later activity
    // can reorder it without moving the reader's viewport. DMs keep following
    // the active row's position.
    if (preserveScrollOnInteraction && isLoading) {
      return;
    }

    if (activeWaveId === null || revealWaveId === null) {
      lastRevealKeyRef.current = null;
      return;
    }

    const revealKey = preserveScrollOnInteraction
      ? `${activeWaveId}:${revealWaveId}`
      : `${activeWaveId}:${revealWaveId}:${virtualRowIndex}`;
    if (lastRevealKeyRef.current === revealKey) {
      return;
    }

    if (virtualRowIndex >= 0) {
      if (scrollToVirtualIndex(virtualRowIndex)) {
        lastRevealKeyRef.current = revealKey;
      }
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer === null) {
      return;
    }

    const rowElement = findWaveRowElement(scrollContainer, revealWaveId);
    if (rowElement === null) {
      return;
    }

    rowElement.scrollIntoView({ block: "nearest" });
    lastRevealKeyRef.current = revealKey;
  }, [
    activeWaveId,
    filterKey,
    isLoading,
    preserveScrollOnInteraction,
    revealWaveId,
    scrollContainerRef,
    scrollToVirtualIndex,
    virtualRowIndex,
  ]);
}
