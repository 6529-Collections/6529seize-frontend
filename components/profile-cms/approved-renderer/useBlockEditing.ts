"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_CONTENT =
  "a,button,input,textarea,select,label,summary,[role=button],[contenteditable=true]";

/** Pointer convenience delegates to the same native button keyboard users activate. */
export function useBlockEditing(enabled: boolean, scope: string) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;
    const selectBlock = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest(INTERACTIVE_CONTENT))
        return;
      const block = target.closest<HTMLElement>("[data-cms-block-id]");
      if (!block || !root.contains(block)) return;
      block.querySelector<HTMLButtonElement>("[data-cms-edit-block]")?.click();
    };
    root.addEventListener("click", selectBlock);
    return () => root.removeEventListener("click", selectBlock);
  }, [enabled, scope]);
  return rootRef;
}
