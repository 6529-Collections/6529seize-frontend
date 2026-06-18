"use client";

import { useEffect, useMemo, useState } from "react";
import type { SidebarWaveTreeRow } from "@/hooks/useSidebarWaveTree";

export const SIDEBAR_SUBWAVE_ROW_TRANSITION_MS = 180 as const;

type SidebarWaveRowAnimationState = "entered" | "entering" | "exiting";
type AfterPaintHandle =
  | {
      type: "animation-frames";
      firstId: number;
      secondId: number | null;
    }
  | {
      readonly type: "timeout";
      readonly id: ReturnType<typeof globalThis.setTimeout>;
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

const requestAfterPaint = (callback: () => void) => {
  if (typeof globalThis.requestAnimationFrame === "function") {
    const handle: AfterPaintHandle = {
      type: "animation-frames",
      firstId: 0,
      secondId: null,
    };
    handle.firstId = globalThis.requestAnimationFrame(() => {
      handle.secondId = globalThis.requestAnimationFrame(callback);
    });
    return handle;
  }

  return {
    type: "timeout",
    id: globalThis.setTimeout(callback, 32),
  } satisfies AfterPaintHandle;
};

const cancelAfterPaint = (handle: AfterPaintHandle) => {
  if (
    handle.type === "animation-frames" &&
    typeof globalThis.cancelAnimationFrame === "function"
  ) {
    globalThis.cancelAnimationFrame(handle.firstId);
    if (handle.secondId !== null) {
      globalThis.cancelAnimationFrame(handle.secondId);
    }
    return;
  }

  if (handle.type === "timeout") {
    globalThis.clearTimeout(handle.id);
  }
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
  const rowKeySignature = rowKeys.join("\n");
  const currentRows = useMemo(() => getEnteredRows(rows), [rows]);

  useEffect(() => {
    const nextKeys = new Set(rowKeys);

    setAnimatedRows((previousRows) => {
      if (previousRows.length === 0) {
        return currentRows.length === 0 ? previousRows : currentRows;
      }

      const previousRowsByKey = new Map(
        previousRows.map((row) => [row.key, row])
      );
      const exitingRowsByParent = keepExitingRows
        ? groupExitingRowsByParent(previousRows, nextKeys)
        : new Map<string, AnimatedSidebarWaveTreeRow[]>();
      const nextRows: AnimatedSidebarWaveTreeRow[] = [];

      for (const row of rows) {
        const previousRow = previousRowsByKey.get(row.key);
        const animationState =
          row.depth === 1 && previousRow === undefined
            ? "entering"
            : "entered";

        nextRows.push({
          ...row,
          animationState,
        });

        if (row.depth === 0) {
          nextRows.push(...(exitingRowsByParent.get(row.wave.id) ?? []));
          exitingRowsByParent.delete(row.wave.id);
        }
      }

      for (const exitingRows of exitingRowsByParent.values()) {
        nextRows.push(...exitingRows);
      }

      return nextRows;
    });

    const enterFrame = requestAfterPaint(() => {
      setAnimatedRows(markEnteringRowsAsEntered);
    });

    const exitTimer = globalThis.setTimeout(() => {
      setAnimatedRows(removeExitingRows);
    }, SIDEBAR_SUBWAVE_ROW_TRANSITION_MS);

    return () => {
      cancelAfterPaint(enterFrame);
      globalThis.clearTimeout(exitTimer);
    };
  }, [currentRows, keepExitingRows, rowKeySignature, rowKeys, rows]);

  const rowsForInitialHydration =
    animatedRows.length === 0 && currentRows.length > 0
      ? currentRows
      : animatedRows;

  return keepExitingRows ? rowsForInitialHydration : currentRows;
}
