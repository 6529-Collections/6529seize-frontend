"use client";

import { useEffect, useMemo, useState } from "react";
import type { SidebarWaveTreeRow } from "@/hooks/useSidebarWaveTree";

export const SIDEBAR_SUBWAVE_ROW_EXIT_TRANSITION_MS = 160 as const;
export const SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS =
  SIDEBAR_SUBWAVE_ROW_EXIT_TRANSITION_MS + 20;

type SidebarWaveRowAnimationState = "entered" | "entering" | "exiting";
type AfterPaintDelay = {
  readonly done: Promise<void>;
  readonly cancel: () => void;
};

export interface AnimatedSidebarWaveTreeRow extends SidebarWaveTreeRow {
  readonly animationState: SidebarWaveRowAnimationState;
}

interface UseAnimatedSidebarWaveRowsOptions {
  readonly keepExitingRows?: boolean | undefined;
}

const getEnteredRows = (
  rows: readonly SidebarWaveTreeRow[]
): AnimatedSidebarWaveTreeRow[] =>
  rows.map((row) => ({
    ...row,
    animationState: "entered",
  }));

const createAfterPaintDelay = (): AfterPaintDelay => {
  let cancel = () => {
    // No scheduled work yet.
  };

  const done = new Promise<void>((resolve) => {
    const resolveAfterPaint = () => {
      resolve();
    };

    if (
      typeof globalThis.requestAnimationFrame === "function" &&
      typeof globalThis.cancelAnimationFrame === "function"
    ) {
      let secondId: number | null = null;
      const firstId = globalThis.requestAnimationFrame(() => {
        secondId = globalThis.requestAnimationFrame(resolveAfterPaint);
      });

      cancel = () => {
        globalThis.cancelAnimationFrame(firstId);
        if (secondId !== null) {
          globalThis.cancelAnimationFrame(secondId);
        }
      };

      return;
    }

    const timeoutId = globalThis.setTimeout(resolveAfterPaint, 32);
    cancel = () => {
      globalThis.clearTimeout(timeoutId);
    };
  });

  return { done, cancel };
};

const getAnimatedRowsForNextTree = ({
  currentRows,
  keepExitingRows,
  previousRows,
  rowKeys,
  rows,
}: {
  readonly currentRows: readonly AnimatedSidebarWaveTreeRow[];
  readonly keepExitingRows: boolean;
  readonly previousRows: readonly AnimatedSidebarWaveTreeRow[];
  readonly rowKeys: readonly string[];
  readonly rows: readonly SidebarWaveTreeRow[];
}): AnimatedSidebarWaveTreeRow[] => {
  if (previousRows.length === 0) {
    return currentRows.length === 0 ? [...previousRows] : [...currentRows];
  }

  const nextKeys = new Set(rowKeys);
  const previousRowsByKey = new Map(previousRows.map((row) => [row.key, row]));
  const exitingRowsByParent = keepExitingRows
    ? groupExitingRowsByParent(previousRows, nextKeys)
    : new Map<string, AnimatedSidebarWaveTreeRow[]>();
  const nextToggleParentIds = getNextToggleParentIds(rows);
  const nextRows: AnimatedSidebarWaveTreeRow[] = [];

  for (const row of rows) {
    const previousRow = previousRowsByKey.get(row.key);
    const animationState =
      row.depth === 1 &&
      (previousRow === undefined || previousRow.animationState === "exiting")
        ? "entering"
        : "entered";

    nextRows.push({
      ...row,
      animationState,
    });

    if (row.rowType === "subwaves-toggle" && row.parentWaveId !== null) {
      nextRows.push(...(exitingRowsByParent.get(row.parentWaveId) ?? []));
      exitingRowsByParent.delete(row.parentWaveId);
      continue;
    }

    if (row.depth === 0 && !nextToggleParentIds.has(row.wave.id)) {
      nextRows.push(...(exitingRowsByParent.get(row.wave.id) ?? []));
      exitingRowsByParent.delete(row.wave.id);
    }
  }

  for (const exitingRows of exitingRowsByParent.values()) {
    nextRows.push(...exitingRows);
  }

  return nextRows;
};

const groupExitingRowsByParent = (
  rows: readonly AnimatedSidebarWaveTreeRow[],
  nextKeys: ReadonlySet<string>
) => {
  const map = new Map<string, AnimatedSidebarWaveTreeRow[]>();

  for (const row of rows) {
    if (nextKeys.has(row.key) || row.depth === 0 || row.parentWaveId === null) {
      continue;
    }

    const parentRows = map.get(row.parentWaveId) ?? [];
    parentRows.push({
      ...row,
      animationState: "exiting",
    });
    map.set(row.parentWaveId, parentRows);
  }

  return map;
};

const getNextToggleParentIds = (rows: readonly SidebarWaveTreeRow[]) => {
  const parentIds = new Set<string>();

  for (const row of rows) {
    if (row.rowType === "subwaves-toggle" && row.parentWaveId !== null) {
      parentIds.add(row.parentWaveId);
    }
  }

  return parentIds;
};

export const getParentIdsWithVisibleSubwaveRows = (
  rows: readonly AnimatedSidebarWaveTreeRow[]
) => {
  const parentIds = new Set<string>();

  for (const row of rows) {
    if (
      row.rowType === "wave" &&
      row.depth === 1 &&
      row.parentWaveId !== null
    ) {
      parentIds.add(row.parentWaveId);
    }
  }

  return parentIds;
};

const markEnteringRowsAsEntered = (
  rows: readonly AnimatedSidebarWaveTreeRow[]
): AnimatedSidebarWaveTreeRow[] =>
  rows.map((row) =>
    row.animationState === "entering"
      ? { ...row, animationState: "entered" }
      : row
  );

const removeExitingRows = (
  rows: readonly AnimatedSidebarWaveTreeRow[]
): AnimatedSidebarWaveTreeRow[] =>
  rows.filter((row) => row.animationState !== "exiting");

export function useAnimatedSidebarWaveRows(
  rows: readonly SidebarWaveTreeRow[],
  { keepExitingRows = true }: UseAnimatedSidebarWaveRowsOptions = {}
) {
  const [animatedRows, setAnimatedRows] = useState<
    AnimatedSidebarWaveTreeRow[]
  >(() => getEnteredRows(rows));

  const rowKeys = useMemo(() => rows.map((row) => row.key), [rows]);
  const currentRows = useMemo(() => getEnteredRows(rows), [rows]);

  useEffect(() => {
    const effectState = { isDisposed: false };
    const enterDelay = createAfterPaintDelay();
    const exitTimer = keepExitingRows
      ? globalThis.setTimeout(() => {
          if (!effectState.isDisposed) {
            setAnimatedRows(removeExitingRows);
          }
        }, SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS)
      : null;

    void (async () => {
      await Promise.resolve();
      if (effectState.isDisposed) {
        return;
      }

      setAnimatedRows((previousRows) =>
        getAnimatedRowsForNextTree({
          currentRows,
          keepExitingRows,
          previousRows,
          rowKeys,
          rows,
        })
      );
    })();

    void (async () => {
      await enterDelay.done;
      if (!effectState.isDisposed) {
        setAnimatedRows(markEnteringRowsAsEntered);
      }
    })();

    return () => {
      effectState.isDisposed = true;
      enterDelay.cancel();
      if (exitTimer !== null) {
        globalThis.clearTimeout(exitTimer);
      }
    };
  }, [currentRows, keepExitingRows, rowKeys, rows]);

  const rowsForInitialHydration =
    animatedRows.length === 0 && currentRows.length > 0
      ? currentRows
      : animatedRows;

  return keepExitingRows ? rowsForInitialHydration : currentRows;
}
