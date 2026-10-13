"use client";

import { useEffect } from "react";

// Render this in place of a lazily loaded surface while its chunk is loading.
// The surface owns Escape once it mounts, but until its chunk arrives nothing
// listens, so an Escape pressed right after opening would be swallowed and the
// surface would still appear later. This listens only while it is mounted.
// The owner renders the loaded surface in its place in a single commit, so the
// listener is removed in the same commit the real surface mounts and the two
// never overlap. Pass undefined while the surface is not open to leave Escape
// alone.
export function CancelOnEscapeWhileLoading({
  onEscape,
}: {
  readonly onEscape: (() => void) | undefined;
}) {
  useEffect(() => {
    if (!onEscape) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [onEscape]);

  return null;
}
