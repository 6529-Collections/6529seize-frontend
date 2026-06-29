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

interface ContainedImageBounds {
  readonly height: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
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

  const updateBounds = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) {
      setBoundsStyle(null);
      return;
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
      setBoundsStyle(null);
      return;
    }

    setBoundsStyle({
      height: `${bounds.height}px`,
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
    });
  }, [containerRef, imageRef, objectPosition]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const initialMeasureTimeout = globalThis.setTimeout(updateBounds, 0);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateBounds);
    resizeObserver?.observe(container);
    globalThis.addEventListener("resize", updateBounds);

    return () => {
      globalThis.clearTimeout(initialMeasureTimeout);
      resizeObserver?.disconnect();
      globalThis.removeEventListener("resize", updateBounds);
    };
  }, [containerRef, loaded, updateBounds]);

  return loaded ? boundsStyle : null;
}
