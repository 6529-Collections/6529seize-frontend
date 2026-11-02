"use client";

import { DEFAULT_TITLE, useTitle } from "@/contexts/TitleContext";
import { STREAM_INDEX_ROUTES } from "@/contexts/title.helpers";
import { getWaveIdFromPathname } from "@/helpers/navigation.helpers";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function normalizeDocumentTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

function hasWaveDropMetadata(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">
): boolean {
  return (
    getWaveIdFromPathname(pathname) !== null &&
    /^\/waves\/[^/]+\/?$/.test(pathname) &&
    ["drop", "serialNo"].some((key) => Boolean(searchParams.get(key)?.trim()))
  );
}

function DynamicHeadTitleContent() {
  const { title, isTitleOwned, titlePathname } = useTitle();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  // Wave metadata already describes the linked drop. The background chat
  // must not replace that title, including while metadata is streaming.
  const hasDropMetadata = hasWaveDropMetadata(pathname, searchParams);
  const normalizedTitle = normalizeDocumentTitle(title);
  const shouldApplyDefaultTitle = pathname === "/" && title === DEFAULT_TITLE;
  const isTitleForCurrentRoute = titlePathname === pathname;
  const previousObservationRef = useRef<{
    title: string;
    pathname: string | null;
  } | null>(null);

  useEffect(() => {
    // A background update may commit before the router's search params catch
    // up with the browser URL. Never re-arm a wave observer over that drop.
    if (
      hasDropMetadata ||
      hasWaveDropMetadata(
        window.location.pathname,
        new URLSearchParams(window.location.search)
      )
    )
      return;

    const previousObservation = previousObservationRef.current;
    if (isTitleForCurrentRoute) {
      previousObservationRef.current = { title: normalizedTitle, pathname };
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
        previousObservation.title !== normalizedTitle;
      const isStreamIndex = STREAM_INDEX_ROUTES.includes(pathname);
      const isStreamDeselectionTransition =
        isTitleForCurrentRoute &&
        isStreamIndex &&
        previousObservation !== null &&
        previousObservation.pathname?.startsWith(`${pathname}/`) === true &&
        previousObservation.title !== normalizedTitle;
      if (
        !normalizeDocumentTitle(document.title) ||
        isSameRouteTransition ||
        isStreamDeselectionTransition
      ) {
        document.title = normalizedTitle;
      }
      return;
    }

    document.title = normalizedTitle;

    // The App Router commits the route's server metadata <title> after
    // hydration/streaming settles, silently overwriting titles set from
    // TitleContext before that point (e.g. useSetTitle on mount). Re-assert
    // owned titles: a text observer scoped to the <title> node catches
    // overwrites, and a shallow head observer re-arms it when the commit
    // replaces the node itself.
    //
    // MutationObserver callbacks are microtasks and can fire between an SPA
    // navigation's head commit and this effect's cleanup, so a stale
    // observer would re-assert the previous route's title over the new
    // route's metadata. Bail once the live location moves off the pathname or query
    // this observation was armed for, including opening a drop in this wave.
    const ownedLocation = window.location.pathname + window.location.search;
    const reassertTitle = () => {
      if (window.location.pathname + window.location.search !== ownedLocation) {
        return;
      }
      if (normalizeDocumentTitle(document.title) !== normalizedTitle) {
        document.title = normalizedTitle;
      }
    };

    const textObserver = new MutationObserver(reassertTitle);
    const observeTitleNode = () => {
      const titleElement = document.head.querySelector("title");
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
    headObserver.observe(document.head, { childList: true });

    return () => {
      headObserver.disconnect();
      textObserver.disconnect();
    };
  }, [
    hasDropMetadata,
    search,
    isTitleForCurrentRoute,
    isTitleOwned,
    pathname,
    normalizedTitle,
    shouldApplyDefaultTitle,
  ]);

  return null;
}

export default function DynamicHeadTitle() {
  return (
    <Suspense fallback={null}>
      <DynamicHeadTitleContent />
    </Suspense>
  );
}
