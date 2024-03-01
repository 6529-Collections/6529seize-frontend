import { useState, useRef, useEffect } from "react";
import { NextGenToken } from "../../../../entities/INextgen";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import { get8KUrl, get16KUrl } from "./NextGenTokenImage";
import Image from "next/image";
import { Spinner } from "../../../dotLoader/DotLoader";

export const MAX_ZOOM_SCALE = 20;
export const MIN_ZOOM_SCALE = 1;

export default function NextGenZoomableImage(
  props: Readonly<{
    token: NextGenToken;
    zoom_scale: number;
    setZoomScale: (scale: number) => void;
    is_fullscreen?: boolean;
    maintain_aspect_ratio: boolean;
  }>
) {
  const isMobileScreen = useIsMobileScreen();
  const isMobileDevice = useIsMobileDevice();

  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = useState(true);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [objectPosition, setObjectPosition] = useState<string>("50% 50%");

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
        ? (e as React.TouchEvent).touches[0].clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      e.type === "touchstart"
        ? (e as React.TouchEvent).touches[0].clientY
        : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX, y: clientY });
    e.preventDefault();
  };

  const handleDragging = (
    e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>
  ) => {
    if (!dragStart || props.zoom_scale === MIN_ZOOM_SCALE) return;

    const clientX =
      e.type === "touchmove"
        ? (e as React.TouchEvent).touches[0].clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      e.type === "touchmove"
        ? (e as React.TouchEvent).touches[0].clientY
        : (e as React.MouseEvent).clientY;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    updateObjectPosition(deltaX, deltaY);
    e.preventDefault();
  };

  const handleDragEnd = (
    e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>
  ) => {
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

      let newX = prevX + adjustedDeltaX;
      let newY = prevY + adjustedDeltaY;

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
  }, [props.zoom_scale]);

  function getImageUrl() {
    if (isMobileDevice) {
      return get8KUrl(props.token.id);
    }
    return get16KUrl(props.token.id);
  }

  function getContent() {
    return (
      <span
        className="d-flex align-items-center justify-content-center"
        style={{
          height: props.is_fullscreen
            ? "100vh"
            : isMobileScreen
            ? "60vh"
            : "85vh",
          width: "auto",
          maxHeight: props.is_fullscreen ? "100vh" : "85vh",
          maxWidth: "100%",
          overflow: "hidden",
        }}>
        {loading && (
          <span className="d-flex flex-column gap-3 align-items-center">
            <span className="d-flex flex-wrap text-center">
              {isMobileDevice ? "8K" : "16K"} Pebbles are very large
            </span>
            <span className="d-flex flex-wrap text-center">
              Chill while we download you into the Pebbles multiverse
            </span>
            <span className="font-larger">
              <Spinner dimension={36} />
            </span>
          </span>
        )}
        <Image
          ref={imgRef}
          priority
          loading={"eager"}
          width="0"
          height="0"
          style={{
            display: loading ? "none" : "initial",
            height: "100%",
            width: "auto",
            transition: "transform 0.2s ease-out",
            objectFit: "contain",
            transform: `scale(${props.zoom_scale})`,
            transformOrigin: objectPosition,
            cursor:
              props.zoom_scale > MIN_ZOOM_SCALE
                ? dragStart
                  ? "grabbing"
                  : "grab"
                : "default",
          }}
          onLoad={() =>
            setTimeout(() => {
              setLoading(false);
            }, 3000)
          }
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
      <span className="d-flex flex-column align-items-center">
        {getContent()}
      </span>
    );
  }

  return getContent();
}
