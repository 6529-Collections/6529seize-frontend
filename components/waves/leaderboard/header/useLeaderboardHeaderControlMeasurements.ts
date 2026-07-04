"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface LeaderboardHeaderControlMeasurements {
  readonly rowWidth: number;
  readonly viewModesWidth: number;
  readonly sortTabsWidth: number;
  readonly sortDropdownWidth: number;
  readonly actionsFullWidth: number;
  readonly actionsIconWidth: number;
}

interface UseLeaderboardHeaderControlMeasurementsInput {
  readonly measureAgainstHeaderRow: boolean;
  readonly remeasureKey: string;
}

interface UseLeaderboardHeaderControlMeasurementsResult {
  readonly headerRowRef: RefObject<HTMLDivElement | null>;
  readonly controlsRowRef: RefObject<HTMLDivElement | null>;
  readonly viewModeTabsRef: RefObject<HTMLDivElement | null>;
  readonly sortTabsProbeRef: RefObject<HTMLDivElement | null>;
  readonly sortDropdownProbeRef: RefObject<HTMLDivElement | null>;
  readonly actionsFullProbeRef: RefObject<HTMLDivElement | null>;
  readonly actionsIconProbeRef: RefObject<HTMLDivElement | null>;
  readonly measurements: LeaderboardHeaderControlMeasurements;
}

const INITIAL_MEASUREMENTS: LeaderboardHeaderControlMeasurements = {
  rowWidth: 0,
  viewModesWidth: 0,
  sortTabsWidth: 0,
  sortDropdownWidth: 0,
  actionsFullWidth: 0,
  actionsIconWidth: 0,
};

const areMeasurementsEqual = (
  current: LeaderboardHeaderControlMeasurements,
  next: LeaderboardHeaderControlMeasurements
): boolean =>
  current.rowWidth === next.rowWidth &&
  current.viewModesWidth === next.viewModesWidth &&
  current.sortTabsWidth === next.sortTabsWidth &&
  current.sortDropdownWidth === next.sortDropdownWidth &&
  current.actionsFullWidth === next.actionsFullWidth &&
  current.actionsIconWidth === next.actionsIconWidth;

export function useLeaderboardHeaderControlMeasurements({
  measureAgainstHeaderRow,
  remeasureKey,
}: UseLeaderboardHeaderControlMeasurementsInput): UseLeaderboardHeaderControlMeasurementsResult {
  const headerRowRef = useRef<HTMLDivElement | null>(null);
  const controlsRowRef = useRef<HTMLDivElement | null>(null);
  const viewModeTabsRef = useRef<HTMLDivElement | null>(null);
  const sortTabsProbeRef = useRef<HTMLDivElement | null>(null);
  const sortDropdownProbeRef = useRef<HTMLDivElement | null>(null);
  const actionsFullProbeRef = useRef<HTMLDivElement | null>(null);
  const actionsIconProbeRef = useRef<HTMLDivElement | null>(null);
  const [measurements, setMeasurements] =
    useState<LeaderboardHeaderControlMeasurements>(INITIAL_MEASUREMENTS);

  const measureNow = useCallback(() => {
    const rowWidth = measureAgainstHeaderRow
      ? (headerRowRef.current?.clientWidth ?? 0)
      : (controlsRowRef.current?.clientWidth ?? 0);

    const nextMeasurements: LeaderboardHeaderControlMeasurements = {
      rowWidth,
      viewModesWidth: viewModeTabsRef.current?.offsetWidth ?? 0,
      sortTabsWidth: sortTabsProbeRef.current?.offsetWidth ?? 0,
      sortDropdownWidth: sortDropdownProbeRef.current?.offsetWidth ?? 0,
      actionsFullWidth: actionsFullProbeRef.current?.offsetWidth ?? 0,
      actionsIconWidth: actionsIconProbeRef.current?.offsetWidth ?? 0,
    };

    setMeasurements((currentMeasurements) =>
      areMeasurementsEqual(currentMeasurements, nextMeasurements)
        ? currentMeasurements
        : nextMeasurements
    );
  }, [measureAgainstHeaderRow]);

  useEffect(() => {
    let frameId: number | null = null;
    let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
    let destroyed = false;

    const cancelScheduledMeasure = () => {
      if (
        frameId !== null &&
        typeof globalThis.window.cancelAnimationFrame === "function"
      ) {
        globalThis.window.cancelAnimationFrame(frameId);
      }
      frameId = null;

      if (timeoutId !== null && typeof globalThis.clearTimeout === "function") {
        globalThis.clearTimeout(timeoutId);
      }
      timeoutId = null;
    };

    const scheduleMeasure = () => {
      cancelScheduledMeasure();

      if (typeof globalThis.window.requestAnimationFrame === "function") {
        frameId = globalThis.window.requestAnimationFrame(() => {
          frameId = null;
          if (!destroyed) {
            measureNow();
          }
        });
        return;
      }

      timeoutId = globalThis.setTimeout(() => {
        timeoutId = null;
        if (!destroyed) {
          measureNow();
        }
      }, 0);
    };

    scheduleMeasure();

    const observedElements = [
      headerRowRef.current,
      controlsRowRef.current,
      viewModeTabsRef.current,
      sortTabsProbeRef.current,
      sortDropdownProbeRef.current,
      actionsFullProbeRef.current,
      actionsIconProbeRef.current,
    ].filter((element): element is HTMLDivElement => Boolean(element));

    if (typeof ResizeObserver === "undefined") {
      globalThis.window.addEventListener("resize", scheduleMeasure);
      return () => {
        destroyed = true;
        cancelScheduledMeasure();
        globalThis.window.removeEventListener("resize", scheduleMeasure);
      };
    }

    const observer = new ResizeObserver(() => {
      scheduleMeasure();
    });

    observedElements.forEach((element) => observer.observe(element));

    return () => {
      destroyed = true;
      cancelScheduledMeasure();
      observer.disconnect();
    };
  }, [measureNow, remeasureKey]);

  return {
    headerRowRef,
    controlsRowRef,
    viewModeTabsRef,
    sortTabsProbeRef,
    sortDropdownProbeRef,
    actionsFullProbeRef,
    actionsIconProbeRef,
    measurements,
  };
}
