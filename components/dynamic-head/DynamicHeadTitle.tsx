"use client";

import { DEFAULT_TITLE, useTitle } from "@/contexts/TitleContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function DynamicHeadTitle() {
  const { title, isTitleOwned, titlePathname } = useTitle();
  const pathname = usePathname();
  const shouldApplyDefaultTitle = pathname === "/" && title === DEFAULT_TITLE;
  const isTitleForCurrentRoute = titlePathname === pathname;
  const previousObservationRef = useRef<{
    title: string;
    pathname: string | null;
  } | null>(null);

  useEffect(() => {
    const previousObservation = previousObservationRef.current;
    if (isTitleForCurrentRoute) {
      previousObservationRef.current = { title, pathname };
    }

    // Route-default placeholders must not beat the route's server metadata
    // title; only explicitly claimed titles (useSetTitle/wave data) or the
    // root path own document.title. Unowned titles get a one-shot write only
    // for same-pathname context transitions (e.g. leaving a wave, where no
    // metadata commit fires) or an empty document title — never across a
    // route change, where the new route's metadata commit must win, and
    // never with stickiness.
    if (!isTitleOwned && !shouldApplyDefaultTitle) {
      const isSameRouteTransition =
        isTitleForCurrentRoute &&
        previousObservation !== null &&
        previousObservation.pathname === pathname &&
        previousObservation.title !== title;
      if (!document.title || isSameRouteTransition) {
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
  }, [
    isTitleForCurrentRoute,
    isTitleOwned,
    pathname,
    shouldApplyDefaultTitle,
    title,
  ]);

  return null;
}
