"use client";

import { useState, useRef, useEffect } from "react";
import type { NextGenToken } from "@/entities/INextgen";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { get8KUrl, get16KUrl } from "./NextGenTokenImage";
import Image from "next/image";
import DotLoader from "@/components/dotLoader/DotLoader";

export const MAX_ZOOM_SCALE = 20;
export const MIN_ZOOM_SCALE = 1;

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [objectPosition, setObjectPosition] = useState<string>("50% 50%");

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    if (dragStart === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      document.body.style.overflow = previousOverflow;
    };
  }, [dragStart]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const imgElement = imgRef.current;
      if (!imgElement) return;

      const rect = imgElement.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const scrollDirection = e.deltaY > 0 ? 1 : -1;
      let newZoomScale = props.zoom_scale + scrollDirection;
      newZoomScale = Math.max(
        MIN_ZOOM_SCALE,
        Math.min(MAX_ZOOM_SCALE, newZoomScale)
      );

      const cursorPercentX = (cursorX / rect.width) * 100;
      const cursorPercentY = (cursorY / rect.height) * 100;

      const newObjectPosition = `${cursorPercentX}% ${cursorPercentY}%`;

      props.setZoomScale(newZoomScale);
      setObjectPosition(newObjectPosition);
    };

    const imgElement = imgRef.current;
    imgElement?.addEventListener("wheel", handleWheel);

    return () => {
      imgElement?.removeEventListener("wheel", handleWheel);
    };
  }, [props.zoom_scale]);

  const handleDragStart = (
    e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>
  ) => {
    const clientX =
      e.type === "touchstart"
        ? (e as React.TouchEvent).touches[0]?.clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      e.type === "touchstart"
        ? (e as React.TouchEvent).touches[0]?.clientY
        : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX!, y: clientY! });
    e.preventDefault();
  };

  const handleDragging = (
    e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>
  ) => {
    if (!dragStart || props.zoom_scale === MIN_ZOOM_SCALE) return;

    const clientX =
      e.type === "touchmove"
        ? (e as React.TouchEvent).touches[0]?.clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      e.type === "touchmove"
        ? (e as React.TouchEvent).touches[0]?.clientY
        : (e as React.MouseEvent).clientY;

    const deltaX = clientX! - dragStart.x;
    const deltaY = clientY! - dragStart.y;

    updateObjectPosition(-deltaX, -deltaY);
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDragStart(null);
  };

  function updateObjectPosition(deltaX: number, deltaY: number) {
    const img = imgRef.current;
    if (!img) return;

    const baseScalingFactor = 0.1 / props.zoom_scale;
    const xScalingFactor =
      baseScalingFactor * (img.clientWidth / img.naturalWidth);
    const yScalingFactor =
      baseScalingFactor * (img.clientHeight / img.naturalHeight);

    const adjustedDeltaX = deltaX * xScalingFactor;
    const adjustedDeltaY = deltaY * yScalingFactor;

    setObjectPosition((prevPosition) => {
      let [prevX, prevY] = prevPosition
        ? prevPosition.split(" ").map((val) => parseFloat(val))
        : [50, 50];

      let newX = prevX! + adjustedDeltaX;
      let newY = prevY! + adjustedDeltaY;

      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      return `${newX}% ${newY}%`;
    });
  }

  useEffect(() => {
    if (props.zoom_scale === MIN_ZOOM_SCALE) {
      const timer = setTimeout(() => {
        setObjectPosition("50% 50%");
      }, 200);

      return () => clearTimeout(timer);
    }
    return;
  }, [props.zoom_scale]);

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
    let cursor = "default";
    if (props.zoom_scale > MIN_ZOOM_SCALE) {
      if (dragStart) {
        cursor = "grabbing";
      } else {
        cursor = "grab";
      }
    }
    return (
      <span
        className={`tw-relative tw-flex tw-items-center tw-justify-center tw-overflow-hidden ${viewportClassName}`}
      >
        {loading && (
          <span className="tw-absolute tw-inset-0 tw-z-[2] tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-bg-black">
            <span className="tw-flex tw-flex-wrap tw-text-center">
              {isMobileDevice ? "8K" : "16K"} Pebbles are very large
            </span>
            <span className="tw-flex tw-flex-wrap tw-text-center">
              Chill while we download you into the Pebbles multiverse
            </span>
            <span className="color-white">
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
        <Image
          unoptimized
          ref={imgRef}
          priority
          loading={"eager"}
          width="0"
          height="0"
          className={`${
            imageLoaded ? "tw-block" : "tw-hidden"
          } tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-object-contain tw-transition-transform tw-duration-200 tw-ease-out`}
          style={{
            transform: `scale(${props.zoom_scale})`,
            transformOrigin: objectPosition,
            cursor: cursor,
          }}
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
