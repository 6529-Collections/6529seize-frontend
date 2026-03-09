"use client";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import {
  clearIdentity,
  disableAnalytics,
  identify,
  initAnalytics,
  trackPageView,
} from "@/services/analytics/mixpanel";
import { classifyPageView } from "@/services/analytics/pageClassification";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function MixpanelSetup() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const { performanceConsent } = useCookieConsent();
  const lastTrackedPageKeyRef = useRef<string | null>(null);
  const identifiedProfileIdRef = useRef<string | null>(null);
  const hasConsent = performanceConsent === true;
  const pageView = classifyPageView({
    pathname,
    searchParams,
  });

  useEffect(() => {
    if (!hasConsent) {
      disableAnalytics();
      lastTrackedPageKeyRef.current = null;
      identifiedProfileIdRef.current = null;
      return;
    }

    initAnalytics();
  }, [hasConsent]);

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    const profileId =
      connectedProfile?.id !== undefined && connectedProfile.id !== null
        ? String(connectedProfile.id)
        : null;

    if (!profileId) {
      if (identifiedProfileIdRef.current !== null) {
        clearIdentity();
        identifiedProfileIdRef.current = null;
      }
      return;
    }

    if (identifiedProfileIdRef.current === profileId) {
      return;
    }

    identify(profileId);
    identifiedProfileIdRef.current = profileId;
  }, [connectedProfile?.id, hasConsent]);

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    if (lastTrackedPageKeyRef.current === pageView.trackingKey) {
      return;
    }

    lastTrackedPageKeyRef.current = pageView.trackingKey;
    trackPageView(pathname, {
      has_connected_profile:
        connectedProfile?.id !== undefined && connectedProfile.id !== null,
      logical_page: pageView.logicalPage,
      page_group: pageView.pageGroup,
      route_pattern: pageView.routePattern,
    });
  }, [connectedProfile?.id, hasConsent, pageView, pathname]);

  return null;
}
