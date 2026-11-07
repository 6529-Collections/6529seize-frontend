"use client";

import { useAuth } from "@/components/auth/Auth";
import { publicEnv } from "@/config/env";
import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { getAuthJwt } from "@/services/auth/auth.utils";
import {
  classifyPageView,
  toRouteTemplate,
} from "@/services/analytics/pageClassification";
import {
  countWebSocket,
  recordPageView,
  setTelemetryCountry,
  startFirstPartyTelemetry,
} from "@/services/analytics/telemetry/collector";
import { WebSocketContext } from "@/services/websocket/WebSocketContext";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { useParams, usePathname } from "next/navigation";
import { useContext, useEffect, useRef } from "react";

// Listen from the moment this chunk runs, before hydration finishes.
startFirstPartyTelemetry();

function FirstPartyTelemetryClient({
  consentEnabled,
}: {
  readonly consentEnabled: boolean;
}) {
  const pathname = usePathname();
  const params = useParams();
  const { connectedProfile } = useAuth();
  const consent = useOptionalCookieConsent();
  const webSocket = useContext(WebSocketContext);
  const lastPathRef = useRef<string | null>(null);
  const wsRef = useRef({ status: webSocket?.status, dropped: false });

  // The cookie banner's country decides whether `fp` may be sent (C52a). A
  // disabled consent provider reports a fixed country, so it counts as unknown.
  const country = consentEnabled ? (consent?.country ?? "") : "";
  const countryPending = consentEnabled && (consent?.isCountryPending ?? false);
  useEffect(() => {
    setTelemetryCountry(country, countryPending);
  }, [country, countryPending]);

  const signedIn = Boolean(connectedProfile?.id) || Boolean(getAuthJwt());
  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    recordPageView({
      pathname,
      route: toRouteTemplate(pathname, params),
      pageGroup: classifyPageView({ pathname }).pageGroup,
      signedIn,
    });
  }, [pathname, params, signedIn]);

  const status = webSocket?.status;
  useEffect(() => {
    const previous = wsRef.current;
    if (status === previous.status) return;
    if (
      previous.status === WebSocketStatus.CONNECTED &&
      status === WebSocketStatus.DISCONNECTED
    ) {
      countWebSocket("drop");
      wsRef.current = { status, dropped: true };
      return;
    }
    if (status === WebSocketStatus.CONNECTED && previous.dropped) {
      countWebSocket("reconnect");
      wsRef.current = { status, dropped: false };
      return;
    }
    wsRef.current = { status, dropped: previous.dropped };
  }, [status]);

  return null;
}

/**
 * First-party collector (R14 §4.1) behind
 * NEXT_PUBLIC_FEATURE_FIRST_PARTY_TELEMETRY. Renders nothing.
 */
export default function FirstPartyTelemetry({
  consentEnabled = true,
}: {
  readonly consentEnabled?: boolean;
}) {
  if (publicEnv.NEXT_PUBLIC_FEATURE_FIRST_PARTY_TELEMETRY !== "true")
    return null;
  return <FirstPartyTelemetryClient consentEnabled={consentEnabled} />;
}
