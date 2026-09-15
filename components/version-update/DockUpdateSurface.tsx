"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  getDockUpdatePath,
  type DockUpdateGeometry,
} from "./dockUpdateGeometry";

export default function DockUpdateSurface() {
  const ref = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<DockUpdateGeometry | null>(null);
  const id = useId();

  useLayoutEffect(() => {
    const dock = ref.current?.parentElement;
    const bubble = dock?.querySelector("[data-version-update-dock]");
    if (!dock || !bubble) return;
    const measure = () => {
      const { width, height } = dock.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const radius = Number.parseFloat(
        getComputedStyle(dock).borderTopLeftRadius
      );
      if (width <= 0 || height <= 0) return;
      setGeometry((current) => {
        const next = {
          width,
          height,
          radius,
          bubbleWidth: bubbleRect.width,
          bubbleHeight: bubbleRect.height,
        };
        return current?.width === width &&
          current.height === height &&
          current.radius === radius &&
          current.bubbleWidth === next.bubbleWidth &&
          current.bubbleHeight === next.bubbleHeight
          ? current
          : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(dock);
    observer.observe(bubble);
    return () => observer.disconnect();
  }, []);

  if (!geometry) return <div ref={ref} aria-hidden="true" />;
  const path = getDockUpdatePath(geometry);
  const height = geometry.height + geometry.bubbleHeight;
  const mask = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geometry.width} ${height}"><path d="${path}"/></svg>`)}")`;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-dock-update-surface="true"
      className="tw-pointer-events-none tw-absolute"
      style={{
        left: -1,
        top: -geometry.bubbleHeight - 1,
        width: geometry.width,
        height,
      }}
    >
      <svg
        width="100%"
        height="100%"
        className="tw-absolute tw-inset-0 tw-overflow-visible"
      >
        <defs>
          {/* Main's outer shadow values, applied to the entire combined silhouette. */}
          <filter
            id={`${id}-shadow`}
            x="-50%"
            y="-150%"
            width="200%"
            height="400%"
          >
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation="22.5"
              result="darkBlur"
            />
            <feOffset in="darkBlur" dy="18" result="darkOffset" />
            <feFlood floodColor="black" floodOpacity="0.48" />
            <feComposite in2="darkOffset" operator="in" result="darkShadow" />
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation="17"
              result="lightBlur"
            />
            <feFlood floodColor="white" floodOpacity="0.075" />
            <feComposite in2="lightBlur" operator="in" result="lightShadow" />
            <feMerge>
              <feMergeNode in="darkShadow" />
              <feMergeNode in="lightShadow" />
            </feMerge>
          </filter>
          <clipPath id={`${id}-clip`}>
            <path d={path} />
          </clipPath>
        </defs>
        <path d={path} fill="black" filter={`url(#${id}-shadow)`} />
      </svg>
      <div
        className="tw-absolute tw-inset-0 tw-bg-black/[0.76] tw-backdrop-blur-2xl [mask-repeat:no-repeat] [mask-size:100%_100%]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
      <svg
        width="100%"
        height="100%"
        className="tw-absolute tw-inset-0 tw-overflow-visible"
        fill="none"
      >
        <path d={path} stroke="rgba(255,255,255,0.045)" strokeWidth="3" />
        <g clipPath={`url(#${id}-clip)`}>
          <path
            d={path}
            stroke="rgba(255,255,255,0.105)"
            transform="translate(0 1)"
          />
          <path
            d={path}
            stroke="rgba(255,255,255,0.06)"
            transform="translate(0 -1)"
          />
        </g>
        <path d={path} stroke="rgba(255,255,255,0.13)" />
      </svg>
    </div>
  );
}
