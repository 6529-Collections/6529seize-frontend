import { useLayoutEffect, useRef, useState } from "react";
import {
  DESKTOP_SEASONS_BREAKPOINT_PX,
  SEASON_TILE_SELECTOR,
} from "./constants";

const getRenderedWidth = (element: HTMLElement | null) =>
  element === null
    ? 0
    : (() => {
        const boundingWidth = element.getBoundingClientRect().width;
        if (boundingWidth > 0) {
          return boundingWidth;
        }

        return Math.max(element.clientWidth, 0);
      })();

const getGap = (styles: CSSStyleDeclaration | undefined): number => {
  if (styles === undefined) {
    return 0;
  }

  const rawGap =
    styles.columnGap ||
    styles.gap ||
    styles.getPropertyValue("column-gap") ||
    styles.getPropertyValue("gap");
  const parsedGap = rawGap.length > 0 ? Number.parseFloat(rawGap) : 0;

  return Number.isFinite(parsedGap) ? parsedGap : 0;
};

export function useDesktopSeasonRowCapacity(seasonCount: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleSeasonCount, setVisibleSeasonCount] = useState<number | null>(
    null
  );

  useLayoutEffect(() => {
    if (typeof globalThis === "undefined") {
      return;
    }

    let cancelPendingMeasure: (() => void) | null = null;

    const measure = () => {
      if (globalThis.innerWidth < DESKTOP_SEASONS_BREAKPOINT_PX) {
        setVisibleSeasonCount(null);
        return;
      }

      const container = containerRef.current;
      if (!container || seasonCount === 0) {
        setVisibleSeasonCount(seasonCount);
        return;
      }

      const firstTile =
        container.querySelector<HTMLElement>(SEASON_TILE_SELECTOR);
      const tileWidth = getRenderedWidth(firstTile);
      const containerWidth = getRenderedWidth(container);
      const gap = getGap(
        firstTile?.parentElement
          ? globalThis.getComputedStyle(firstTile.parentElement)
          : globalThis.getComputedStyle(container)
      );

      if (tileWidth <= 0 || containerWidth <= 0) {
        setVisibleSeasonCount(seasonCount);
        return;
      }

      const slotsPerRow = Math.max(
        1,
        Math.floor((containerWidth + gap) / (tileWidth + gap))
      );
      setVisibleSeasonCount(Math.min(seasonCount, slotsPerRow));
    };

    const scheduleMeasure = () => {
      cancelPendingMeasure?.();

      if (typeof globalThis.requestAnimationFrame === "function") {
        const frameId = globalThis.requestAnimationFrame(() => {
          cancelPendingMeasure = null;
          measure();
        });
        cancelPendingMeasure = () => {
          globalThis.cancelAnimationFrame(frameId);
          cancelPendingMeasure = null;
        };
        return;
      }

      const timeoutId = globalThis.setTimeout(() => {
        cancelPendingMeasure = null;
        measure();
      });
      cancelPendingMeasure = () => {
        globalThis.clearTimeout(timeoutId);
        cancelPendingMeasure = null;
      };
    };

    measure();

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(scheduleMeasure)
        : null;

    if (containerRef.current && resizeObserver) {
      resizeObserver.observe(containerRef.current);
    }

    globalThis.addEventListener("resize", scheduleMeasure);

    return () => {
      cancelPendingMeasure?.();
      resizeObserver?.disconnect();
      globalThis.removeEventListener("resize", scheduleMeasure);
    };
  }, [seasonCount]);

  return {
    containerRef,
    visibleSeasonCount,
    isDesktopLayout: visibleSeasonCount !== null,
  };
}
