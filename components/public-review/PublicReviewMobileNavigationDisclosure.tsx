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
