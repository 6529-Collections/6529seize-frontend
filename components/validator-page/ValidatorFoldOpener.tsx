"use client";

import { useEffect } from "react";

function openFoldForHash() {
  const id = decodeURIComponent(globalThis.location.hash.slice(1));
  if (!id) {
    return;
  }
  const target = document.getElementById(id);
  const fold = target?.closest("details");
  if (fold && !fold.open) {
    fold.open = true;
    target?.scrollIntoView({ block: "start" });
  }
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
