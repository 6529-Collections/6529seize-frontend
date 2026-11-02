"use client";

import { useEffect } from "react";

/**
 * A link to a part ("#part-network") or a disclosure ("#machines") opens
 * it: the `<details>` it names, or the one it sits in, opens before the
 * browser scrolls to it. Renders nothing.
 */
export default function OpenOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      let node: HTMLElement | null = target;
      let opened = false;
      while (node) {
        if (node instanceof HTMLDetailsElement && !node.open) {
          node.open = true;
          opened = true;
        }
        node = node.parentElement;
      }
      if (opened) target.scrollIntoView();
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
