"use client";

import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { trackAnalyticsEvent } from "@/services/analytics/mixpanel";
import { Capacitor } from "@capacitor/core";
import { useEffect, useEffectEvent, useRef, type MouseEvent } from "react";
import {
  getHomepageClick,
  HOMEPAGE_EVENT_NAMES,
  observeHomepageSections,
  type HomepageSection,
} from "./homepageTracking";

function getScreenSize() {
  if (globalThis.innerWidth < 640) return "Small";
  if (globalThis.innerWidth < 1024) return "Medium";
  return "Large";
}

export function useHomepageTracking(signedIn: boolean) {
  const consent = useOptionalCookieConsent();
  const allowed = consent?.performanceConsent === true;
  const rootRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(new Set<HomepageSection>());
  const properties = () => ({
    logical_page: "home",
    layout_version: "1",
    signed_in: signedIn,
    is_native: Capacitor.isNativePlatform(),
    screen_size: getScreenSize(),
  });
  const onSeen = useEffectEvent((section: HomepageSection) => {
    trackAnalyticsEvent(HOMEPAGE_EVENT_NAMES.sectionSeen, {
      ...properties(),
      section,
    });
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!allowed || !root) return;
    return observeHomepageSections(root, onSeen, seenRef.current);
  }, [allowed]);

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!allowed || !rootRef.current || event.button > 1) return;
    // Middle-click activates links, but does not activate ordinary buttons.
    if (
      event.button === 1 &&
      (!(event.target instanceof Element) || !event.target.closest("a[href]"))
    )
      return;
    const click = getHomepageClick(rootRef.current, event.target);
    if (!click) return;
    trackAnalyticsEvent(HOMEPAGE_EVENT_NAMES.actionClicked, {
      ...properties(),
      ...click,
    });
  };

  return { rootRef, onClickCapture };
}
