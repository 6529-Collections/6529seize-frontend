"use client";

import { useEffect, useRef } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getDesktopShellApi } from "@/helpers/desktop-shell";
import { parseBrowserConnectorResult } from "@/lib/desktop/browserConnector";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";
import {
  loginWithSessionV2,
  persistSessionResponse,
} from "@/services/auth/session-v2.utils";
import { getSignOutAllState } from "@/services/auth/sign-out-all-state";
import {
  setBrowserConnectorStatus,
  takeBrowserConnectorRequest,
} from "@/services/desktop/browserConnectorSignIn";
import { markBrowserWalletProfile } from "@/services/desktop/desktopBrowserWallet";

/**
 * Inside 6529 Desktop: receives the browser connector's return link
 * (`<scheme>://connector?data=...`), checks it against the request this app
 * opened, and signs in through the desktop shell with the signed challenge.
 * Anything malformed, unexpected, expired or replayed is ignored. Renders
 * nothing and does nothing on the web.
 */
export default function DesktopBrowserConnectorBridge() {
  const { seizeAcceptConnection } = useSeizeConnectContext();
  const acceptConnection = useRef(seizeAcceptConnection);

  useEffect(() => {
    acceptConnection.current = seizeAcceptConnection;
  }, [seizeAcceptConnection]);

  useEffect(() => {
    const api = getDesktopShellApi();
    if (typeof api?.onWalletConnection !== "function") return undefined;
    // An older host has no offWalletConnection, so its listener is never
    // removed: after unmount it must not consume a request or sign in.
    let active = true;
    const stopIfInactive = (): boolean => {
      if (active) return false;
      setBrowserConnectorStatus("failed");
      return true;
    };

    const signIn = async (payload: unknown) => {
      if (!active) return;
      const result = parseBrowserConnectorResult(payload);
      if (!result || !takeBrowserConnectorRequest(result.requestId)) return;
      // Read synchronously: a sign-out-all that starts and ends between two
      // renders still counts. False once one started after this sign-in.
      const signOutsAtStart = getSignOutAllState().started;
      const shouldPersist = () => {
        const signOutAll = getSignOutAllState();
        return (
          active &&
          !signOutAll.running &&
          signOutAll.started === signOutsAtStart
        );
      };
      if (!shouldPersist()) {
        setBrowserConnectorStatus("failed");
        return;
      }
      setBrowserConnectorStatus("signing-in");
      try {
        if (!canStoreAnotherWalletAccount(result.address)) {
          setBrowserConnectorStatus("failed");
          return;
        }
        const session = await loginWithSessionV2({
          serverSignature: result.serverSignature,
          clientSignature: result.clientSignature,
          signerAddress: result.address,
          role: null,
        });
        if (stopIfInactive()) return;
        // The session must be for the wallet that signed (both lower-cased).
        if (session.address.toLowerCase() !== result.address.toLowerCase()) {
          setBrowserConnectorStatus("failed");
          return;
        }
        if (!(await persistSessionResponse(session, { shouldPersist }))) {
          setBrowserConnectorStatus("failed");
          return;
        }
        if (stopIfInactive() || !shouldPersist()) {
          setBrowserConnectorStatus("failed");
          return;
        }
        acceptConnection.current(session.address);
        setBrowserConnectorStatus("signed-in");
        // Offer wallet forwarding to this profile; never fails the sign-in.
        markBrowserWalletProfile(session.address).catch(() => undefined);
      } catch {
        setBrowserConnectorStatus("failed");
      }
    };

    const onWalletConnection = (_event: unknown, payload: unknown) => {
      signIn(payload).catch(() => undefined);
    };
    api.onWalletConnection(onWalletConnection);
    return () => {
      active = false;
      api.offWalletConnection?.(onWalletConnection);
    };
  }, []);

  return null;
}
