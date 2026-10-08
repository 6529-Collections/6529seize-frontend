"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { getProfileViewerContext } from "@/helpers/ProfileHelpers";
import { trackAnalyticsEvent } from "@/services/analytics/mixpanel";
import { observeAnalyticsSections } from "@/services/analytics/sectionVisibility";
import { Capacitor } from "@capacitor/core";
import {
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  type MouseEvent,
} from "react";
import {
  COLLECTED_SECTIONS,
  getCollectedClick,
  PROFILE_EVENT_NAMES,
  type CollectedAction,
  type CollectedSection,
} from "./collectedTracking";

function getPlatform() {
  if (Capacitor.isNativePlatform()) return "native";
  if (navigator.userAgent.includes("Electron")) return "desktop_app";
  return globalThis.innerWidth < 768 ? "mobile_web" : "desktop_web";
}

export function useCollectedTracking(handleOrWallet: string) {
  const consent = useOptionalCookieConsent();
  const { connectedProfile, fetchingProfile } = useContext(AuthContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewerContext = getProfileViewerContext({
    connectedProfile,
    handleOrWallet,
  });
  const allowed =
    consent?.performanceConsent === true &&
    !fetchingProfile &&
    viewerContext !== null;
  // This key stays local; changing profiles or viewer identity starts fresh exposure.
  const visitKey = `${handleOrWallet.toLowerCase()}:${connectedProfile?.id ?? "anonymous"}`;
  const visitRef = useRef({ key: visitKey, seen: new Set<CollectedSection>() });
  const properties = () => ({
    logical_page: "profile_collected",
    page_group: "profile",
    route_pattern: "/:handle/collected",
    profile_tab: "Collected",
    profile_viewer_context: viewerContext,
    platform: getPlatform(),
  });
  const onSeen = useEffectEvent((section: CollectedSection) => {
    if (!allowed) return false;
    return trackAnalyticsEvent(PROFILE_EVENT_NAMES.sectionSeen, {
      ...properties(),
      section,
    });
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!allowed || !root) return;
    if (visitRef.current.key !== visitKey) {
      visitRef.current = { key: visitKey, seen: new Set<CollectedSection>() };
    }
    return observeAnalyticsSections({
      root,
      attribute: "data-profile-section-anchor",
      sections: COLLECTED_SECTIONS,
      seen: visitRef.current.seen,
      onSeen,
    });
  }, [allowed, visitKey]);

  const trackAction = (section: CollectedSection, action: CollectedAction) => {
    if (!allowed) return;
    trackAnalyticsEvent(PROFILE_EVENT_NAMES.actionClicked, {
      ...properties(),
      section,
      action,
    });
  };
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!allowed || !rootRef.current || event.button > 1) return;
    if (
      event.button === 1 &&
      (!(event.target instanceof Element) || !event.target.closest("a[href]"))
    )
      return;
    const click = getCollectedClick(rootRef.current, event.target);
    if (click) trackAction(click.section, click.action);
  };

  return { rootRef, onClickCapture, trackAction };
}
