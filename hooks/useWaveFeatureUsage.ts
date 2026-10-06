"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { AuthContext } from "@/components/auth/authContext";
import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import useDeviceInfo from "./useDeviceInfo";
import { isAnalyticsTrackingAllowed } from "@/services/analytics/mixpanel";
import {
  isWaveFeatureVisible,
  observeWaveFeatures,
} from "@/services/analytics/waveFeatureVisibility";
import {
  waveFeatureRouteFamily,
  recordWaveFeatureActivation,
  type WaveFeatureDescriptor,
  type WaveFeatureContext,
  type WaveFeaturePlacement,
} from "@/services/analytics/waveFeatureUsage";

export function useWaveFeatureUsage<T extends HTMLElement = HTMLDivElement>(
  placement: WaveFeaturePlacement,
  scope = "sidebar",
  enabled = true
) {
  const rootRef = useRef<T>(null);
  const consent = useOptionalCookieConsent();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { isApp } = useDeviceInfo();
  const hasConsent = consent?.performanceConsent === true;
  let viewer: WaveFeatureContext["viewer"] = "guest";
  if (activeProfileProxy) viewer = "proxy";
  else if (connectedProfile) viewer = "profile";
  const viewerKey = `${connectedProfile?.id ?? "guest"}:${activeProfileProxy?.id ?? "self"}`;

  const getContext = useCallback((): WaveFeatureContext | null => {
    if (!enabled || !hasConsent || !isAnalyticsTrackingAllowed()) return null;
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search);
    let platform: WaveFeatureContext["platform"] = "desktop_web";
    if (isApp) platform = "native";
    else if (navigator.userAgent.includes("Electron")) platform = "desktop_app";
    else if (window.matchMedia("(max-width: 767px)").matches)
      platform = "mobile_web";
    return {
      key: `${pathname}:${params.get("wave") ?? ""}:${params.get("competition") ?? ""}:${viewerKey}`,
      scope,
      routeFamily: waveFeatureRouteFamily(pathname),
      platform,
      viewer,
    };
  }, [enabled, hasConsent, isApp, scope, viewer, viewerKey]);

  const activate = (
    descriptor: WaveFeatureDescriptor,
    element: HTMLElement
  ) => {
    try {
      const context = getContext();
      if (context && isWaveFeatureVisible(element)) {
        recordWaveFeatureActivation(context, descriptor, "choose");
      }
    } catch {
      /* Selection remains independent of telemetry. */
    }
  };

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      !enabled ||
      !hasConsent ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    try {
      return observeWaveFeatures({
        root,
        placement,
        getContext,
      });
    } catch {
      // Observers and telemetry are optional; controls retain their normal behavior.
      return undefined;
    }
  }, [enabled, getContext, hasConsent, placement]);
  return { ref: rootRef, activate };
}
