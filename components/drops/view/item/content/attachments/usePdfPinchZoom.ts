import { useEffect, type RefObject } from "react";

// The native shell disables viewport zoom. Magnify only the document, keeping
// the close button available and ordinary one-finger scrolling native.
export default function usePdfPinchZoom(
  viewportRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content || !enabled) return;
    let scale = 1;
    let pinch: {
      distance: number;
      scale: number;
      x: number;
      y: number;
    } | null = null;
    const zoom = (next: number, x: number, y: number) => {
      const bounded = Math.min(4, Math.max(1, next));
      const ratio = bounded / scale;
      const left = (viewport.scrollLeft + x) * ratio - x;
      const top = (viewport.scrollTop + y) * ratio - y;
      content.style.zoom = String(bounded);
      viewport.scrollLeft = left;
      viewport.scrollTop = top;
      scale = bounded;
    };
    const start = (event: TouchEvent) => {
      const [first, second] = Array.from(event.touches);
      if (event.touches.length !== 2 || !first || !second) return;
      const distance = Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY
      );
      if (!distance) return;
      const rect = viewport.getBoundingClientRect();
      pinch = {
        distance,
        scale,
        x: (first.clientX + second.clientX) / 2 - rect.left,
        y: (first.clientY + second.clientY) / 2 - rect.top,
      };
      event.preventDefault();
    };
    const move = (event: TouchEvent) => {
      const [first, second] = Array.from(event.touches);
      if (!pinch || event.touches.length !== 2 || !first || !second) return;
      event.preventDefault();
      const distance = Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY
      );
      zoom((pinch.scale * distance) / pinch.distance, pinch.x, pinch.y);
    };
    const end = () => {
      pinch = null;
    };
    const doubleClick = (event: MouseEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      zoom(
        scale > 1 ? 1 : 2,
        event.clientX - rect.left,
        event.clientY - rect.top
      );
    };
    viewport.addEventListener("touchstart", start, { passive: false });
    viewport.addEventListener("touchmove", move, { passive: false });
    viewport.addEventListener("touchend", end);
    viewport.addEventListener("touchcancel", end);
    viewport.addEventListener("dblclick", doubleClick);
    return () => {
      viewport.removeEventListener("touchstart", start);
      viewport.removeEventListener("touchmove", move);
      viewport.removeEventListener("touchend", end);
      viewport.removeEventListener("touchcancel", end);
      viewport.removeEventListener("dblclick", doubleClick);
      content.style.zoom = "";
    };
  }, [viewportRef, contentRef, enabled]);
}
