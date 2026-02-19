"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface LeaderboardHeaderControlMeasurements {
  readonly availableWidth: number;
  readonly viewModesWidth: number;
  readonly sortTabsWidth: number;
  readonly sortDropdownWidth: number;
  readonly curationTabsWidth: number;
  readonly curationDropdownWidth: number;
}

interface UseLeaderboardHeaderControlMeasurementsInput {
  readonly showCurationGroupSelect: boolean;
  readonly remeasureKey: string;
}

interface UseLeaderboardHeaderControlMeasurementsResult {
  readonly controlsRowRef: RefObject<HTMLDivElement | null>;
  readonly viewModeTabsRef: RefObject<HTMLDivElement | null>;
  readonly sortTabsProbeRef: RefObject<HTMLDivElement | null>;
  readonly sortDropdownProbeRef: RefObject<HTMLDivElement | null>;
  readonly curationTabsProbeRef: RefObject<HTMLDivElement | null>;
  readonly curationDropdownProbeRef: RefObject<HTMLDivElement | null>;
  readonly measurements: LeaderboardHeaderControlMeasurements;
}

const INITIAL_MEASUREMENTS: LeaderboardHeaderControlMeasurements = {
  availableWidth: 0,
  viewModesWidth: 0,
  sortTabsWidth: 0,
  sortDropdownWidth: 0,
  curationTabsWidth: 0,
  curationDropdownWidth: 0,
};

const areMeasurementsEqual = (
  current: LeaderboardHeaderControlMeasurements,
  next: LeaderboardHeaderControlMeasurements
): boolean =>
  current.availableWidth === next.availableWidth &&
  current.viewModesWidth === next.viewModesWidth &&
  current.sortTabsWidth === next.sortTabsWidth &&
  current.sortDropdownWidth === next.sortDropdownWidth &&
  current.curationTabsWidth === next.curationTabsWidth &&
  current.curationDropdownWidth === next.curationDropdownWidth;

export function useLeaderboardHeaderControlMeasurements({
  showCurationGroupSelect,
  remeasureKey,
}: UseLeaderboardHeaderControlMeasurementsInput): UseLeaderboardHeaderControlMeasurementsResult {
  const controlsRowRef = useRef<HTMLDivElement | null>(null);
  const viewModeTabsRef = useRef<HTMLDivElement | null>(null);
  const sortTabsProbeRef = useRef<HTMLDivElement | null>(null);
  const sortDropdownProbeRef = useRef<HTMLDivElement | null>(null);
  const curationTabsProbeRef = useRef<HTMLDivElement | null>(null);
  const curationDropdownProbeRef = useRef<HTMLDivElement | null>(null);
  const [measurements, setMeasurements] =
    useState<LeaderboardHeaderControlMeasurements>(INITIAL_MEASUREMENTS);

  const measureNow = useCallback(() => {
    const nextMeasurements: LeaderboardHeaderControlMeasurements = {
      availableWidth: controlsRowRef.current?.clientWidth ?? 0,
      viewModesWidth: viewModeTabsRef.current?.offsetWidth ?? 0,
      sortTabsWidth: sortTabsProbeRef.current?.offsetWidth ?? 0,
      sortDropdownWidth: sortDropdownProbeRef.current?.offsetWidth ?? 0,
      curationTabsWidth: showCurationGroupSelect
        ? (curationTabsProbeRef.current?.offsetWidth ?? 0)
        : 0,
      curationDropdownWidth: showCurationGroupSelect
        ? (curationDropdownProbeRef.current?.offsetWidth ?? 0)
        : 0,
    };

    setMeasurements((currentMeasurements) =>
      areMeasurementsEqual(currentMeasurements, nextMeasurements)
        ? currentMeasurements
        : nextMeasurements
    );
  }, [showCurationGroupSelect]);

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
      controlsRowRef.current,
      viewModeTabsRef.current,
      sortTabsProbeRef.current,
      sortDropdownProbeRef.current,
      showCurationGroupSelect ? curationTabsProbeRef.current : null,
      showCurationGroupSelect ? curationDropdownProbeRef.current : null,
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
  }, [measureNow, remeasureKey, showCurationGroupSelect]);

  return {
    controlsRowRef,
    viewModeTabsRef,
    sortTabsProbeRef,
    sortDropdownProbeRef,
    curationTabsProbeRef,
    curationDropdownProbeRef,
    measurements,
  };
}
