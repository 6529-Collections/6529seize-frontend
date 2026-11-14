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
import {
  setBrowserConnectorStatus,
  takeBrowserConnectorRequest,
} from "@/services/desktop/browserConnectorSignIn";

/**
 * Inside 6529 Desktop: receives the browser connector's return link
 * (`<scheme>://connector?data=...`), checks it against the request this app
 * opened, and signs in through the desktop shell with the signed challenge.
 * Anything malformed, unexpected, expired or replayed is ignored. Renders
 * nothing and does nothing on the web.
 */
export default function DesktopBrowserConnectorBridge() {
  const { seizeAcceptConnection, isSigningOutAll } = useSeizeConnectContext();
  const acceptConnection = useRef(seizeAcceptConnection);
  // Sign-out-all runs so far, and whether one is running: a sign-in that
  // started before one must not save its session afterwards.
  const signOutAll = useRef({ running: false, count: 0 });

  useEffect(() => {
    acceptConnection.current = seizeAcceptConnection;
  }, [seizeAcceptConnection]);

  useEffect(() => {
    const { count } = signOutAll.current;
    signOutAll.current = isSigningOutAll
      ? { running: true, count: count + 1 }
      : { running: false, count };
  }, [isSigningOutAll]);

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
      const signOutsAtStart = signOutAll.current.count;
      // False once a sign-out-all started after this sign-in began.
      const shouldPersist = () =>
        active &&
        !signOutAll.current.running &&
        signOutAll.current.count === signOutsAtStart;
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
