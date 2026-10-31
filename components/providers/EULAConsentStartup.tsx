"use client";

import { EULAConsentProvider } from "@/components/eula/EULAConsentContext";
import {
  CONSENT_EULA_COOKIE,
  CURRENT_EULA_VERSION,
} from "@/constants/constants";
import { Capacitor } from "@capacitor/core";
import Cookies from "js-cookie";
import { useState, useSyncExternalStore, type ReactNode } from "react";

// Read once per document and never re-read. The value selects the provider's
// key, so it describes how this document started, not current consent.
// Accepting the EULA writes the cookie; re-reading it would flip the key and
// remount the accepted app. The mounted provider still owns the live consent
// state across client navigations, and a full reload starts a new document.
let nativeIosCheckRequired: boolean | undefined;

const subscribe = () => () => undefined;
const getServerSnapshot = () => false;
const getNativeIosCheckRequired = (): boolean => {
  nativeIosCheckRequired ??=
    Capacitor.getPlatform() === "ios" &&
    Cookies.get(CONSENT_EULA_COOKIE) !== CURRENT_EULA_VERSION;
  return nativeIosCheckRequired;
};

/**
 * Starts the native iOS EULA gate from the state the server could see.
 *
 * Request-time pages read the native iOS and consent cookies on the server.
 * Prerendered pages cannot, so their HTML always holds the ungated tree.
 * Native startup styles keep that tree hidden; when the browser finds native
 * iOS without a current acceptance, the commit that reveals native iOS swaps in
 * a provider that starts in the blocking check instead.
 */
export default function EULAConsentStartup({
  children,
  initialIsIos,
  initialConsentVersion,
}: {
  readonly children: ReactNode;
  readonly initialIsIos: boolean;
  readonly initialConsentVersion?: string | undefined;
}) {
  // Later root layout refreshes may carry new cookies; only the first render
  // describes the HTML that hydrated.
  const [serverStartedCheck] = useState(
    () => initialIsIos && initialConsentVersion !== CURRENT_EULA_VERSION
  );
  const nativeIosCheck = useSyncExternalStore(
    subscribe,
    getNativeIosCheckRequired,
    getServerSnapshot
  );
  const startCheckInBrowser = nativeIosCheck && !serverStartedCheck;

  return (
    <EULAConsentProvider
      key={startCheckInBrowser ? "native-ios-eula-check" : "eula-consent"}
      initialIsIos={initialIsIos || startCheckInBrowser}
      initialConsentVersion={
        startCheckInBrowser ? undefined : initialConsentVersion
      }
    >
      {children}
    </EULAConsentProvider>
  );
}
