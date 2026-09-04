"use client";

import type { SidebarWaveTreeRow } from "@/hooks/useSidebarWaveTree";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";

interface UseRevealActiveSidebarWaveOptions {
  readonly activeParentWaveId: string | null;
  readonly activeWaveId: string | null;
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
  scrollContainerRef,
  scrollToVirtualIndex,
  staticRows,
  virtualRows,
}: UseRevealActiveSidebarWaveOptions) {
  const lastRevealKeyRef = useRef<string | null>(null);
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
    if (activeWaveId === null || revealWaveId === null) {
      lastRevealKeyRef.current = null;
      return;
    }

    // Main-list queries hydrate independently. Include the virtual position so
    // rows inserted ahead of the active wave cannot move it back off-screen
    // after the first successful reveal.
    const revealLocation =
      virtualRowIndex >= 0 ? `virtual:${virtualRowIndex}` : "static";
    const revealKey = `${activeWaveId}:${revealWaveId}:${revealLocation}`;
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
    revealWaveId,
    scrollContainerRef,
    scrollToVirtualIndex,
    virtualRowIndex,
  ]);
}
