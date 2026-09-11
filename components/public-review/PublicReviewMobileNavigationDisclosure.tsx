"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";

import { usePublicReviewFeedbackPanelCoordination } from "@/components/public-review/PublicReviewReadingLayout";

const MOBILE_NAVIGATION_QUERY = "(max-width: 1023px)";

export function PublicReviewMobileNavigationDisclosure({
  children,
  resetKey,
}: {
  readonly children: ReactNode;
  readonly resetKey: string;
}) {
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const feedbackPanel = usePublicReviewFeedbackPanelCoordination();

  useLayoutEffect(() => {
    const disclosure = disclosureRef.current;
    if (!disclosure) {
      return;
    }

    disclosure.open = false;
    const closeAfterFollowingSectionLink = (event: MouseEvent): void => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        event.button === 0 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey &&
        link?.getAttribute("href")?.startsWith("#")
      ) {
        disclosure.open = false;
      }
    };
    disclosure.addEventListener("click", closeAfterFollowingSectionLink);
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
      disclosure.removeEventListener("click", closeAfterFollowingSectionLink);
      mobileNavigationQuery.removeEventListener(
        "change",
        closeWhenEnteringMobileLayout
      );
    };
  }, [resetKey]);

  useLayoutEffect(() => {
    if (feedbackPanel.isOpen && disclosureRef.current) {
      disclosureRef.current.open = false;
    }
  }, [feedbackPanel.isOpen]);

  const handleToggle = (): void => {
    if (disclosureRef.current?.open && feedbackPanel.isOpen) {
      feedbackPanel.close();
    }
  };

  return (
    <details
      ref={disclosureRef}
      className="tw-group/navigation tw-static lg:tw-hidden"
      onToggle={handleToggle}
    >
      {children}
    </details>
  );
}
