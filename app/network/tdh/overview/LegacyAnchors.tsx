"use client";

import { useEffect } from "react";

/**
 * Old links still land (MAP.md §2): anchors of sections that moved to other
 * pages send the reader there; anchors that stayed on the overview are
 * ids on its sections and need nothing.
 */
const MOVED: Readonly<Record<string, string>> = {
  "tdh-changes": "/network/tdh/consolidation#why",
  "tdh-1-4": "/network/tdh/how-it-works#part-c",
  "tdh-exact": "/network/tdh/how-it-works",
  "tdh-how": "/network/tdh/how-it-works",
  glossary: "/network/tdh/glossary",
};

const GLOSSARY_TERM = /^glossary-([a-z0-9-]+)$/;

/** Where an old anchor now lives, or null when it is on this page. */
export function movedAnchor(hash: string): string | null {
  const id = hash.replace(/^#/, "");
  const moved = MOVED[id];
  if (moved !== undefined) {
    return moved;
  }
  const term = GLOSSARY_TERM.exec(id)?.[1];
  return term === undefined ? null : `/network/tdh/glossary#${term}`;
}

export default function LegacyAnchors() {
  useEffect(() => {
    const follow = () => {
      const target = movedAnchor(globalThis.location.hash);
      if (target !== null) {
        globalThis.location.replace(target);
      }
    };
    follow();
    globalThis.addEventListener("hashchange", follow);
    return () => globalThis.removeEventListener("hashchange", follow);
  }, []);
  return null;
}
