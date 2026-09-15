"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  getDockUpdatePath,
  getDockBubblePath,
  type DockUpdateGeometry,
} from "./dockUpdateGeometry";

export default function DockUpdateSurface({
  dockClassName,
}: {
  readonly dockClassName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<(DockUpdateGeometry & { readonly borderWidth: number }) | null>(null);

  useLayoutEffect(() => {
    const dock = ref.current?.parentElement;
    const bubble = dock?.querySelector("[data-version-update-dock]");
    if (!dock || !bubble) return;
    const measure = () => {
      const { width, height } = dock.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const computed = getComputedStyle(dock);
      const radius = Number.parseFloat(computed.borderTopLeftRadius);
      const borderWidth = Number.parseFloat(computed.borderLeftWidth) || 0;
      if (width <= 0 || height <= 0) return;
      setGeometry((current) => {
        const next = {
          width,
          height,
          radius,
          borderWidth,
          bubbleWidth: bubbleRect.width,
          bubbleHeight: bubbleRect.height,
        };
        return current?.width === width &&
          current.height === height &&
          current.radius === radius &&
          current.borderWidth === borderWidth &&
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
  const shadowPadding = 96;
  // Keep the native CSS paint outside the join; padding preserves its entire glow.
  const paintMask = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.width + shadowPadding * 2}" height="${height + shadowPadding * 2}"><path fill-rule="evenodd" d="M0 0 H${geometry.width + shadowPadding * 2} V${height + shadowPadding * 2} H0 Z M${shadowPadding + (geometry.width - geometry.bubbleWidth) / 2} ${shadowPadding + geometry.bubbleHeight - 1} h${geometry.bubbleWidth} v4 h-${geometry.bubbleWidth} Z"/></svg>`)}")`;
  const bubblePath = getDockBubblePath(geometry);
  const mask = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geometry.width} ${height}"><path d="${path}"/></svg>`)}")`;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-dock-update-surface="true"
      className="tw-pointer-events-none tw-absolute"
      style={{
        left: -geometry.borderWidth,
        top: -geometry.bubbleHeight - geometry.borderWidth,
        width: geometry.width,
        height,
      }}
    >
      <div
        className="tw-absolute tw-inset-0 tw-bg-black/[0.76] tw-backdrop-blur-2xl [mask-repeat:no-repeat] [mask-size:100%_100%]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
      <div
        className="tw-pointer-events-none tw-absolute [mask-repeat:no-repeat] [mask-size:100%_100%]"
        style={{
          inset: -shadowPadding,
          maskImage: paintMask,
          WebkitMaskImage: paintMask,
        }}
      >
        <div
          data-native-dock-paint="true"
          className={dockClassName}
          style={{
            position: "absolute",
            left: shadowPadding,
            top: shadowPadding + geometry.bubbleHeight,
            width: geometry.width,
            height: geometry.height,
            borderRadius: geometry.radius,
            background: "transparent",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            transition: "none",
            pointerEvents: "none",
          }}
        />
      </div>
      <svg
        width="100%"
        height="100%"
        className="tw-absolute tw-inset-0 tw-overflow-visible"
        fill="none"
      >
        <path d={bubblePath} stroke="rgba(255,255,255,0.13)" />
      </svg>
    </div>
  );
}
