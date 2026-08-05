"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";

const MOBILE_NAVIGATION_QUERY = "(max-width: 1023px)";

export function PublicReviewMobileNavigationDisclosure({
  children,
  resetKey,
}: {
  readonly children: ReactNode;
  readonly resetKey: string;
}) {
  const disclosureRef = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const disclosure = disclosureRef.current;
    if (!disclosure) {
      return;
    }

    disclosure.open = false;
    const mobileNavigationQuery = window.matchMedia(MOBILE_NAVIGATION_QUERY);
    const closeWhenEnteringMobileLayout = (
      event: MediaQueryListEvent
    ): void => {
      if (event.matches) {
        disclosure.open = false;
      }
    };

    mobileNavigationQuery.addEventListener(
      "change",
      closeWhenEnteringMobileLayout
    );
    return () => {
      mobileNavigationQuery.removeEventListener(
        "change",
        closeWhenEnteringMobileLayout
      );
    };
  }, [resetKey]);

  return (
    <details
      ref={disclosureRef}
      className="tw-group/navigation tw-static lg:tw-hidden"
    >
      {children}
    </details>
  );
}
