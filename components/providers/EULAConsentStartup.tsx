"use client";

import { EULAConsentProvider } from "@/components/eula/EULAConsentContext";
import {
  CONSENT_EULA_COOKIE,
  CURRENT_EULA_VERSION,
} from "@/constants/constants";
import { Capacitor } from "@capacitor/core";
import Cookies from "js-cookie";
import { useSyncExternalStore, type ReactNode } from "react";

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
 * Starts the native iOS EULA gate in the browser on every route.
 *
 * The server never reads the native iOS or consent cookies, so every page's
 * HTML holds the ungated tree and can be prerendered. Native startup styles
 * keep that tree hidden; when the browser finds native iOS without a current
 * acceptance, the commit that reveals native iOS swaps in a provider that
 * starts in the blocking check instead.
 */
export default function EULAConsentStartup({
  children,
}: {
  readonly children: ReactNode;
}) {
  const nativeIosCheck = useSyncExternalStore(
    subscribe,
    getNativeIosCheckRequired,
    getServerSnapshot
  );

  return (
    <EULAConsentProvider
      key={nativeIosCheck ? "native-ios-eula-check" : "eula-consent"}
      initialIsIos={nativeIosCheck}
    >
      {children}
    </EULAConsentProvider>
  );
}
