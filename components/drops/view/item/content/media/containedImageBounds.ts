"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

interface ContainedImageBoundsParams {
  readonly containerHeight: number;
  readonly containerWidth: number;
  readonly naturalHeight: number;
  readonly naturalWidth: number;
  readonly objectPosition: string;
}

const MAX_BOUNDS_MEASURE_RETRIES = 8;

interface ContainedImageBounds {
  readonly height: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
}

function areBoundsStylesEqual(
  current: CSSProperties | null,
  next: CSSProperties | null
) {
  if (current === next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.height === next.height &&
    current.left === next.left &&
    current.top === next.top &&
    current.width === next.width
  );
}

function getAxisOffset({
  axis,
  objectPosition,
  remainingSpace,
}: {
  readonly axis: "x" | "y";
  readonly objectPosition: string;
  readonly remainingSpace: number;
}) {
  const normalizedPosition = objectPosition.toLowerCase();

  if (axis === "x") {
    if (normalizedPosition.includes("left")) {
      return 0;
    }

    if (normalizedPosition.includes("right")) {
      return remainingSpace;
    }
  }

  if (axis === "y") {
    if (normalizedPosition.includes("top")) {
      return 0;
    }

    if (normalizedPosition.includes("bottom")) {
      return remainingSpace;
    }
  }

  return remainingSpace / 2;
}

export function getContainedImageBounds({
  containerHeight,
  containerWidth,
  naturalHeight,
  naturalWidth,
  objectPosition,
}: ContainedImageBoundsParams): ContainedImageBounds | null {
  if (
    containerHeight <= 0 ||
    containerWidth <= 0 ||
    naturalHeight <= 0 ||
    naturalWidth <= 0
  ) {
    return null;
  }

  const scale = Math.min(
    containerWidth / naturalWidth,
    containerHeight / naturalHeight
  );
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const remainingX = Math.max(0, containerWidth - width);
  const remainingY = Math.max(0, containerHeight - height);

  return {
    height,
    left: getAxisOffset({
      axis: "x",
      objectPosition,
      remainingSpace: remainingX,
    }),
    top: getAxisOffset({
      axis: "y",
      objectPosition,
      remainingSpace: remainingY,
    }),
    width,
  };
}

export function useContainedImageBoundsStyle({
  containerRef,
  imageRef,
  loaded,
  objectPosition,
}: {
  readonly containerRef: RefObject<HTMLElement | null>;
  readonly imageRef: RefObject<HTMLImageElement | null>;
  readonly loaded: boolean;
  readonly objectPosition: string;
}): CSSProperties | null {
  const [boundsStyle, setBoundsStyle] = useState<CSSProperties | null>(null);

  const clearBoundsStyle = useCallback(() => {
    setBoundsStyle((current) => (current === null ? current : null));
  }, []);

  const updateBounds = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) {
      clearBoundsStyle();
      return false;
    }

    const containerRect = container.getBoundingClientRect();
    const bounds = getContainedImageBounds({
      containerHeight: containerRect.height,
      containerWidth: containerRect.width,
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      objectPosition,
    });

    if (!bounds) {
      clearBoundsStyle();
      return false;
    }

    const nextBoundsStyle = {
      height: `${bounds.height}px`,
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
    };

    setBoundsStyle((current) =>
      areBoundsStylesEqual(current, nextBoundsStyle) ? current : nextBoundsStyle
    );
    return true;
  }, [clearBoundsStyle, containerRef, imageRef, objectPosition]);

  useEffect(() => {
    if (!loaded) {
      clearBoundsStyle();
      return;
    }

    const container = containerRef.current;
    if (!container) {
      clearBoundsStyle();
      return;
    }

    let disposed = false;
    let measureFrame: number | null = null;
    let measureTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
    let retryAttempt = 0;

    const cancelPendingMeasure = () => {
      if (measureFrame !== null) {
        globalThis.cancelAnimationFrame(measureFrame);
        measureFrame = null;
      }

      if (measureTimeout !== null) {
        globalThis.clearTimeout(measureTimeout);
        measureTimeout = null;
      }
    };

    const scheduleMeasure = () => {
      cancelPendingMeasure();

      const measure = () => {
        measureFrame = null;
        measureTimeout = null;

        if (disposed) {
          return;
        }

        const measured = updateBounds();
        if (!measured && retryAttempt < MAX_BOUNDS_MEASURE_RETRIES) {
          retryAttempt += 1;
          scheduleMeasure();
        }
      };

      if (typeof globalThis.requestAnimationFrame === "function") {
        measureFrame = globalThis.requestAnimationFrame(measure);
      } else {
        measureTimeout = globalThis.setTimeout(measure, 16);
      }
    };

    const resetAndScheduleMeasure = () => {
      retryAttempt = 0;
      scheduleMeasure();
    };

    const initialMeasureTimeout = globalThis.setTimeout(
      resetAndScheduleMeasure,
      0
    );
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(resetAndScheduleMeasure);
    resizeObserver?.observe(container);
    if (imageRef.current) {
      resizeObserver?.observe(imageRef.current);
    }
    globalThis.addEventListener("resize", resetAndScheduleMeasure);

    return () => {
      disposed = true;
      globalThis.clearTimeout(initialMeasureTimeout);
      cancelPendingMeasure();
      resizeObserver?.disconnect();
      globalThis.removeEventListener("resize", resetAndScheduleMeasure);
    };
  }, [clearBoundsStyle, containerRef, imageRef, loaded, updateBounds]);

  return loaded ? boundsStyle : null;
}
