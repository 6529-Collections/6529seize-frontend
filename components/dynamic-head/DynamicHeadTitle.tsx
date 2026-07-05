"use client";

import { DEFAULT_TITLE, useTitle } from "@/contexts/TitleContext";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DynamicHeadTitle() {
  const { title, isTitleOwned } = useTitle();
  const pathname = usePathname();
  const shouldApplyDefaultTitle = pathname === "/" && title === DEFAULT_TITLE;

  useEffect(() => {
    // Route-default placeholders must not beat the route's server metadata
    // title; only explicitly claimed titles (useSetTitle/wave data) or the
    // root path own document.title. An empty title gets a one-shot fallback
    // write without stickiness.
    if (!isTitleOwned && !shouldApplyDefaultTitle) {
      if (!document.title) {
        document.title = title;
      }
      return;
    }

    document.title = title;

    // The App Router commits the route's server metadata <title> after
    // hydration/streaming settles, silently overwriting titles set from
    // TitleContext before that point (e.g. useSetTitle on mount). Watch the
    // head (the commit may also replace the <title> node itself) and
    // re-assert until this effect is replaced or the context stops owning
    // the title.
    const observer = new MutationObserver(() => {
      if (document.title !== title) {
        document.title = title;
      }
    });
    observer.observe(document.head, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [isTitleOwned, shouldApplyDefaultTitle, title]);

  return null;
}
