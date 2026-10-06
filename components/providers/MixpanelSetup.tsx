"use client";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { getProfileViewerContext } from "@/helpers/ProfileHelpers";
import {
  clearIdentity,
  disableAnalytics,
  identify,
  initAnalytics,
  trackPageView,
} from "@/services/analytics/mixpanel";
import { classifyPageView } from "@/services/analytics/pageClassification";
import { resetWaveFeatureVisit } from "@/services/analytics/waveFeatureUsage";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const IDENTITY_RETRY_DELAYS = [1000, 5000] as const;

const getProfileRouteTarget = (pathname: string): string | null => {
  return pathname.split("/").find((segment) => segment.length > 0) ?? null;
};

export default function MixpanelSetup() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { connectedProfile, fetchingProfile } = useAuth();
  const { performanceConsent } = useCookieConsent();
  const lastTrackedPageKeyRef = useRef<string | null>(null);
  const identifiedProfileIdRef = useRef<string | null>(null);
  const hasConsent = performanceConsent === true;
  const pageView = classifyPageView({
    pathname,
    searchParams,
  });
  const profileViewerContext = pageView.logicalPage.startsWith("profile_")
    ? getProfileViewerContext({
        connectedProfile,
        handleOrWallet: getProfileRouteTarget(pathname),
      })
    : null;

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

    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryAttempt = 0;
    const attemptIdentity = () => {
      if (identify(profileId)) {
        identifiedProfileIdRef.current = profileId;
        return;
      }
      identifiedProfileIdRef.current = null;
      const retryDelay = IDENTITY_RETRY_DELAYS.at(retryAttempt);
      if (retryDelay === undefined) return;
      retryAttempt += 1;
      retryTimer = setTimeout(() => {
        initAnalytics();
        attemptIdentity();
      }, retryDelay);
    };
    attemptIdentity();
    return () => {
      if (retryTimer !== undefined) clearTimeout(retryTimer);
    };
  }, [connectedProfile?.id, hasConsent]);

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    if (pageView.logicalPage.startsWith("profile_") && fetchingProfile) {
      return;
    }

    if (lastTrackedPageKeyRef.current === pageView.trackingKey) {
      return;
    }

    lastTrackedPageKeyRef.current = pageView.trackingKey;
    resetWaveFeatureVisit();
    trackPageView(pageView.routePattern, {
      has_connected_profile:
        connectedProfile?.id !== undefined && connectedProfile.id !== null,
      logical_page: pageView.logicalPage,
      page_group: pageView.pageGroup,
      profile_viewer_context: profileViewerContext ?? undefined,
      route_pattern: pageView.routePattern,
    });
  }, [
    connectedProfile?.id,
    fetchingProfile,
    hasConsent,
    pageView,
    pathname,
    profileViewerContext,
  ]);

  return null;
}
