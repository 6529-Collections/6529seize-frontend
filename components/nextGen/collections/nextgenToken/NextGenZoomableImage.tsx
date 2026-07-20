"use client";

import DotLoader from "@/components/dotLoader/DotLoader";
import type { NextGenToken } from "@/entities/INextgen";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { get16KUrl, get8KUrl } from "./NextGenTokenImage";

export const MAX_ZOOM_SCALE = 20;
export const MIN_ZOOM_SCALE = 1;

const BODY_SCROLL_LOCK_CLASS = "tw-overflow-hidden";

const ZOOM_CANVAS_SIZE_CLASSES: Record<number, string> = {
  1: "tw-h-full tw-w-full",
  2: "tw-h-[200%] tw-w-[200%]",
  3: "tw-h-[300%] tw-w-[300%]",
  4: "tw-h-[400%] tw-w-[400%]",
  5: "tw-h-[500%] tw-w-[500%]",
  6: "tw-h-[600%] tw-w-[600%]",
  7: "tw-h-[700%] tw-w-[700%]",
  8: "tw-h-[800%] tw-w-[800%]",
  9: "tw-h-[900%] tw-w-[900%]",
  10: "tw-h-[1000%] tw-w-[1000%]",
  11: "tw-h-[1100%] tw-w-[1100%]",
  12: "tw-h-[1200%] tw-w-[1200%]",
  13: "tw-h-[1300%] tw-w-[1300%]",
  14: "tw-h-[1400%] tw-w-[1400%]",
  15: "tw-h-[1500%] tw-w-[1500%]",
  16: "tw-h-[1600%] tw-w-[1600%]",
  17: "tw-h-[1700%] tw-w-[1700%]",
  18: "tw-h-[1800%] tw-w-[1800%]",
  19: "tw-h-[1900%] tw-w-[1900%]",
  20: "tw-h-[2000%] tw-w-[2000%]",
};

interface PointerPosition {
  readonly x: number;
  readonly y: number;
}

interface ZoomAnchor {
  readonly contentX: number;
  readonly contentY: number;
  readonly pointerX: number;
  readonly pointerY: number;
  readonly previousScale: number;
}

function normalizeZoomScale(scale: number): number {
  return Math.min(MAX_ZOOM_SCALE, Math.max(MIN_ZOOM_SCALE, Math.round(scale)));
}

function getPointerPosition(
  event: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>
): PointerPosition | null {
  if (event.type.startsWith("touch")) {
    const touch = (event as React.TouchEvent<HTMLImageElement>).touches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  const mouseEvent = event as React.MouseEvent<HTMLImageElement>;
  return { x: mouseEvent.clientX, y: mouseEvent.clientY };
}

export default function NextGenZoomableImage(
  props: Readonly<{
    token: NextGenToken;
    zoom_scale: number;
    setZoomScale: (scale: number) => void;
    is_fullscreen?: boolean | undefined;
    maintain_aspect_ratio: boolean;
    onImageLoaded: () => void;
  }>
) {
  const isMobileScreen = useIsMobileScreen();
  const isMobileDevice = useIsMobileDevice();

  const imgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLSpanElement>(null);
  const dragStartRef = useRef<PointerPosition | null>(null);
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const normalizedZoomScale = normalizeZoomScale(props.zoom_scale);

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    if (!isDragging) {
      return;
    }

    const bodyWasLocked = document.body.classList.contains(
      BODY_SCROLL_LOCK_CLASS
    );
    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    document.body.classList.add(BODY_SCROLL_LOCK_CLASS);

    return () => {
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      if (!bodyWasLocked) {
        document.body.classList.remove(BODY_SCROLL_LOCK_CLASS);
      }
    };
  }, [isDragging]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const viewport = viewportRef.current;
      if (!viewport) return;

      const scrollDirection = e.deltaY > 0 ? 1 : -1;
      const newZoomScale = normalizeZoomScale(
        normalizedZoomScale + scrollDirection
      );
      if (newZoomScale === normalizedZoomScale) return;

      const rect = viewport.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      zoomAnchorRef.current = {
        contentX: viewport.scrollLeft + pointerX,
        contentY: viewport.scrollTop + pointerY,
        pointerX,
        pointerY,
        previousScale: normalizedZoomScale,
      };

      props.setZoomScale(newZoomScale);
    };

    const viewport = viewportRef.current;
    viewport?.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport?.removeEventListener("wheel", handleWheel);
    };
  }, [normalizedZoomScale, props.setZoomScale]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const zoomAnchor = zoomAnchorRef.current;
    if (!viewport || !zoomAnchor) return;

    const scaleRatio = normalizedZoomScale / zoomAnchor.previousScale;
    viewport.scrollLeft =
      zoomAnchor.contentX * scaleRatio - zoomAnchor.pointerX;
    viewport.scrollTop = zoomAnchor.contentY * scaleRatio - zoomAnchor.pointerY;
    zoomAnchorRef.current = null;
  }, [normalizedZoomScale]);

  const handleDragStart = (
    e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>
  ) => {
    if (normalizedZoomScale === MIN_ZOOM_SCALE) return;

    const pointerPosition = getPointerPosition(e);
    if (!pointerPosition) return;

    dragStartRef.current = pointerPosition;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDragging = (
    e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>
  ) => {
    const viewport = viewportRef.current;
    const dragStart = dragStartRef.current;
    const pointerPosition = getPointerPosition(e);
    if (!viewport || !dragStart || !pointerPosition) return;

    viewport.scrollLeft -= pointerPosition.x - dragStart.x;
    viewport.scrollTop -= pointerPosition.y - dragStart.y;
    dragStartRef.current = pointerPosition;
    e.preventDefault();
  };

  const handleDragEnd = () => {
    dragStartRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    if (normalizedZoomScale !== MIN_ZOOM_SCALE) return;

    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }, [normalizedZoomScale]);

  function getImageUrl() {
    if (isMobileDevice) {
      return get8KUrl(props.token.id);
    }
    return get16KUrl(props.token.id);
  }

  function ensureImageRendered() {
    setTimeout(() => {
      props.setZoomScale(MIN_ZOOM_SCALE);
      setTimeout(() => {
        setLoading(false);
        props.onImageLoaded();
      }, 5000);
    }, 8000);
  }

  function getContent() {
    let viewportClassName = "tw-h-[85vh] tw-max-h-[85vh] tw-max-w-full";
    if (props.is_fullscreen) {
      viewportClassName =
        "tw-h-[calc(100dvh-2rem)] tw-w-[calc(100vw-2rem)] tw-max-h-[calc(100dvh-2rem)] tw-max-w-[calc(100vw-2rem)]";
    } else if (isMobileScreen) {
      viewportClassName = "tw-h-[55vh] tw-max-h-[55vh] tw-max-w-full";
    }
    let cursorClassName = "tw-cursor-default";
    if (normalizedZoomScale > MIN_ZOOM_SCALE) {
      cursorClassName = isDragging ? "tw-cursor-grabbing" : "tw-cursor-grab";
    }

    const zoomCanvasClassName =
      ZOOM_CANVAS_SIZE_CLASSES[normalizedZoomScale] ??
      ZOOM_CANVAS_SIZE_CLASSES[MIN_ZOOM_SCALE];

    return (
      <span
        ref={viewportRef}
        data-testid="zoom-viewport"
        className={`tw-no-scrollbar tw-relative tw-block tw-overflow-auto ${viewportClassName}`}
      >
        {loading && (
          <span className="tw-absolute tw-inset-0 tw-z-[2] tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-bg-black">
            <span className="tw-flex tw-flex-wrap tw-text-center">
              {isMobileDevice ? "8K" : "16K"} Pebbles are very large
            </span>
            <span className="tw-flex tw-flex-wrap tw-text-center">
              Chill while we download you into the Pebbles multiverse
            </span>
            <span className="tw-text-white">
              {imageLoaded ? (
                <>
                  Almost There <DotLoader />
                </>
              ) : (
                <>
                  Downloading <DotLoader />
                </>
              )}
            </span>
          </span>
        )}
        <span
          data-testid="zoom-canvas"
          className={`tw-flex tw-items-center tw-justify-center tw-transition-[width,height] tw-duration-200 tw-ease-out ${zoomCanvasClassName}`}
        >
          <Image
            unoptimized
            ref={imgRef}
            priority
            draggable={false}
            loading="eager"
            width="0"
            height="0"
            className={`${
              imageLoaded ? "tw-block" : "tw-hidden"
            } tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-select-none tw-object-contain ${cursorClassName}`}
            onLoad={() => {
              props.setZoomScale(MIN_ZOOM_SCALE + 1);
              setImageLoaded(true);
              ensureImageRendered();
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onMouseMove={handleDragging}
            onTouchMove={handleDragging}
            onMouseUp={handleDragEnd}
            onTouchEnd={handleDragEnd}
            onMouseLeave={handleDragEnd}
            src={getImageUrl()}
            alt={props.token.name}
            onError={(e) => {
              e.currentTarget.src = "/fallback-image.jpeg";
            }}
          />
        </span>
      </span>
    );
  }

  if (props.maintain_aspect_ratio) {
    return (
      <span className="tw-flex tw-flex-col tw-items-center">
        {getContent()}
      </span>
    );
  }

  return getContent();
}
