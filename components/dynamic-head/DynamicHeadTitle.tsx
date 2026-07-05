"use client";

import { DEFAULT_TITLE, useTitle } from "@/contexts/TitleContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function DynamicHeadTitle() {
  const { title, isTitleOwned } = useTitle();
  const pathname = usePathname();
  const shouldApplyDefaultTitle = pathname === "/" && title === DEFAULT_TITLE;
  const previousTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const previousTitle = previousTitleRef.current;
    previousTitleRef.current = title;

    // Route-default placeholders must not beat the route's server metadata
    // title on load; only explicitly claimed titles (useSetTitle/wave data)
    // or the root path own document.title. Unowned titles still get a
    // one-shot write when the context transitions (e.g. leaving a wave on
    // the same pathname, where no metadata commit fires) or when the
    // document title is empty — without stickiness, so any later metadata
    // commit wins.
    if (!isTitleOwned && !shouldApplyDefaultTitle) {
      const contextTitleChanged =
        previousTitle !== null && previousTitle !== title;
      if (!document.title || contextTitleChanged) {
        document.title = title;
      }
      return;
    }

    document.title = title;

    const head = document.head;
    if (!head) {
      return;
    }

    // The App Router commits the route's server metadata <title> after
    // hydration/streaming settles, silently overwriting titles set from
    // TitleContext before that point (e.g. useSetTitle on mount). Re-assert
    // owned titles: a text observer scoped to the <title> node catches
    // overwrites, and a shallow head observer re-arms it when the commit
    // replaces the node itself.
    const reassertTitle = () => {
      if (document.title !== title) {
        document.title = title;
      }
    };

    const textObserver = new MutationObserver(reassertTitle);
    const observeTitleNode = () => {
      const titleElement = head.querySelector("title");
      if (titleElement) {
        textObserver.observe(titleElement, {
          characterData: true,
          childList: true,
          subtree: true,
        });
      }
    };
    observeTitleNode();

    const headObserver = new MutationObserver(() => {
      textObserver.disconnect();
      observeTitleNode();
      reassertTitle();
    });
    headObserver.observe(head, { childList: true });

    return () => {
      headObserver.disconnect();
      textObserver.disconnect();
    };
  }, [isTitleOwned, shouldApplyDefaultTitle, title]);

  return null;
}
