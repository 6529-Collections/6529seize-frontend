"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

/** Shared chat-area file drop handling. Editor-owned drops stay with that editor. */
export function useChatFileDrop({
  onFiles,
  enabled = true,
  includeEditor = false,
}: {
  readonly onFiles: (files: File[]) => void;
  readonly enabled?: boolean;
  readonly includeEditor?: boolean;
}) {
  const depth = useRef(0);
  const [active, setActive] = useState(false);
  const reset = () => {
    depth.current = 0;
    setActive(false);
  };
  useEffect(() => {
    const clear = () => {
      depth.current = 0;
      setActive(false);
    };
    globalThis.window.addEventListener("dragend", clear);
    globalThis.window.addEventListener("drop", clear);
    return () => {
      globalThis.window.removeEventListener("dragend", clear);
      globalThis.window.removeEventListener("drop", clear);
    };
  }, []);

  const consume = (event: DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return false;
    if (
      !includeEditor &&
      event.target instanceof Element &&
      event.target.closest(
        '[contenteditable="true"], input, textarea, [role="textbox"]'
      )
    )
      return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  return {
    active: enabled && active,
    handlers: {
      onDragEnter: (event: DragEvent<HTMLElement>) => {
        if (!consume(event)) return;
        depth.current += 1;
        setActive(true);
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!consume(event)) return;
        event.dataTransfer.dropEffect = enabled ? "copy" : "none";
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (!consume(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setActive(false);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!consume(event)) return;
        reset();
        const files = Array.from(event.dataTransfer.files);
        if (enabled && files.length > 0) onFiles(files);
      },
    },
  };
}
