"use client";

import { useCallback, useEffect } from "react";

/**
 * Old links still land (MAP.md §2): an anchor a page no longer has is moved
 * to where its content went, on load and on every hash change. Each page
 * gives its own resolver, from the old anchor (without its "#") to the new
 * one; a target that starts with "/" is another page. An anchor the page
 * still has is left alone.
 */
export function useLegacyAnchors(
  resolve: (hash: string) => string | undefined
): void {
  useEffect(() => {
    const land = () => {
      const hash = decodeURIComponent(globalThis.location.hash.slice(1));
      if (!hash || document.getElementById(hash)) {
        return;
      }
      const target = resolve(hash);
      if (target === undefined) {
        return;
      }
      if (target.startsWith("/")) {
        globalThis.location.replace(target);
        return;
      }
      const id = target.replace(/^#/, "");
      globalThis.history.replaceState(null, "", `#${id}`);
      document.getElementById(id)?.scrollIntoView();
    };
    land();
    globalThis.addEventListener("hashchange", land);
    return () => globalThis.removeEventListener("hashchange", land);
  }, [resolve]);
}

/** A page whose old anchors are a fixed list: the list, from the server. */
export default function LegacyAnchors({
  moved,
}: {
  readonly moved: Readonly<Record<string, string>>;
}) {
  const resolve = useCallback((hash: string) => moved[hash], [moved]);
  useLegacyAnchors(resolve);
  return null;
}
