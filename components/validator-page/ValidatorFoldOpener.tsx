"use client";

import { useEffect } from "react";

function openFoldForHash() {
  let id: string;
  try {
    id = decodeURIComponent(globalThis.location.hash.slice(1));
  } catch {
    // A malformed hash in a shared link names no fold.
    return;
  }
  const target = id ? document.getElementById(id) : null;
  if (!target) {
    return;
  }
  // Open the fold itself and every fold around it.
  let opened = false;
  for (
    let fold = target.closest("details");
    fold;
    fold = fold.parentElement?.closest("details") ?? null
  ) {
    if (!fold.open) {
      fold.open = true;
      opened = true;
    }
  }
  if (!opened) {
    return;
  }
  // Keyboard and screen reader users carry on from the opened fold.
  target
    .closest("details")
    ?.querySelector<HTMLElement>(":scope > summary")
    ?.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start" });
}

/** Opens the fold a link points at, such as #linux-and-the-terminal. */
export default function ValidatorFoldOpener() {
  useEffect(() => {
    openFoldForHash();
    globalThis.addEventListener("hashchange", openFoldForHash);
    return () => globalThis.removeEventListener("hashchange", openFoldForHash);
  }, []);
  return null;
}
