"use client";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import {
  identify,
  initAnalytics,
  reset,
  trackPageView,
} from "@/services/analytics/mixpanel";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function MixpanelSetup() {
  const pathname = usePathname();
  const { connectedProfile } = useAuth();
  const { performanceConsent } = useCookieConsent();
  const lastTrackedPathRef = useRef<string | null>(null);
  const identifiedProfileIdRef = useRef<string | null>(null);
  const hasConsent = performanceConsent === true;

  useEffect(() => {
    if (!hasConsent) {
      reset();
      lastTrackedPathRef.current = null;
      identifiedProfileIdRef.current = null;
      return;
    }

    initAnalytics();
  }, [hasConsent]);

  useEffect(() => {
    if (!hasConsent || !pathname) {
      return;
    }

    if (lastTrackedPathRef.current === pathname) {
      return;
    }

    lastTrackedPathRef.current = pathname;
    trackPageView(pathname, {
      has_connected_profile:
        connectedProfile?.id !== undefined && connectedProfile.id !== null,
    });
  }, [connectedProfile?.id, hasConsent, pathname]);

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
        reset();
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

  return null;
}
