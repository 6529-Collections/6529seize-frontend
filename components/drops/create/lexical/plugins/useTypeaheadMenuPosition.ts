"use client";

import { useCallback, useEffect, useState } from "react";

type TypeaheadMenuPosition = "top" | "bottom";

export function useTypeaheadMenuPosition(
  anchorElement: HTMLElement | null
): TypeaheadMenuPosition {
  const [position, setPosition] = useState<TypeaheadMenuPosition>("bottom");

  const updatePosition = useCallback(() => {
    if (globalThis.window === undefined || anchorElement === null) {
      return;
    }

    const visualViewport = globalThis.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight =
      visualViewport?.height ?? globalThis.window.innerHeight;
    const anchorRect = anchorElement.getBoundingClientRect();
    const spaceAbove = anchorRect.top - viewportTop;
    const spaceBelow = viewportTop + viewportHeight - anchorRect.bottom;
    const nextPosition: TypeaheadMenuPosition =
      spaceBelow >= spaceAbove ? "bottom" : "top";

    setPosition((current) =>
      current === nextPosition ? current : nextPosition
    );
  }, [anchorElement]);

  useEffect(() => {
    if (globalThis.window === undefined || anchorElement === null) {
      return;
    }

    const win = globalThis.window;
    const doc = win.document;
    const visualViewport = globalThis.visualViewport;
    const passiveScrollOptions: AddEventListenerOptions = { passive: true };
    const capturingScrollOptions: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };
    const cancelInitialUpdate =
      typeof win.requestAnimationFrame === "function"
        ? (() => {
            const frame = win.requestAnimationFrame(updatePosition);
            return () => win.cancelAnimationFrame(frame);
          })()
        : (() => {
            const timeout = win.setTimeout(updatePosition, 0);
            return () => win.clearTimeout(timeout);
          })();

    win.addEventListener("resize", updatePosition);
    win.addEventListener("scroll", updatePosition, passiveScrollOptions);
    doc.addEventListener("scroll", updatePosition, capturingScrollOptions);
    visualViewport?.addEventListener("resize", updatePosition);
    visualViewport?.addEventListener("scroll", updatePosition, {
      passive: true,
    });

    const resizeObserver =
      globalThis.ResizeObserver === undefined
        ? null
        : new globalThis.ResizeObserver(updatePosition);
    resizeObserver?.observe(anchorElement);

    return () => {
      cancelInitialUpdate();
      win.removeEventListener("resize", updatePosition);
      win.removeEventListener("scroll", updatePosition);
      doc.removeEventListener("scroll", updatePosition, { capture: true });
      visualViewport?.removeEventListener("resize", updatePosition);
      visualViewport?.removeEventListener("scroll", updatePosition);
      resizeObserver?.disconnect();
    };
  }, [anchorElement, updatePosition]);

  return position;
}
