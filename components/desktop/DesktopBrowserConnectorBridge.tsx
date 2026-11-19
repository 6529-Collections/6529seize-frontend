"use client";

import { useEffect, useRef } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getDesktopShellApi } from "@/helpers/desktop-shell";
import { parseBrowserConnectorResult } from "@/lib/desktop/browserConnector";
import {
  canStoreAnotherWalletAccount,
  getWalletAddress,
} from "@/services/auth/auth.utils";
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
    const signIn = async (payload: unknown) => {
      if (!active) return;
      const result = parseBrowserConnectorResult(payload);
      if (!result) return;
      const request = takeBrowserConnectorRequest(result.requestId);
      if (!request) return;
      const { setup, isCurrent } = request;
      const fail = () => {
        if (!isCurrent()) return;
        setBrowserConnectorStatus("failed");
        setup?.onStatus("failed");
      };
      // Read synchronously: a sign-out-all that starts and ends between two
      // renders still counts. False once one started after this sign-in.
      const signOutsAtStart = getSignOutAllState().started;
      const shouldPersist = () => {
        const signOutAll = getSignOutAllState();
        return (
          active &&
          isCurrent() &&
          !signOutAll.running &&
          signOutAll.started === signOutsAtStart &&
          (!setup || getWalletAddress()?.toLowerCase() === setup.address)
        );
      };
      if (
        !shouldPersist() ||
        (setup && result.address.toLowerCase() !== setup.address)
      ) {
        fail();
        return;
      }
      setBrowserConnectorStatus("signing-in");
      setup?.onStatus("signing-in");
      try {
        if (!canStoreAnotherWalletAccount(result.address)) {
          fail();
          return;
        }
        const session = await loginWithSessionV2({
          serverSignature: result.serverSignature,
          clientSignature: result.clientSignature,
          signerAddress: result.address,
          role: null,
        });
        // The session must be for the wallet that signed (both lower-cased).
        if (
          !shouldPersist() ||
          session.address.toLowerCase() !== result.address.toLowerCase()
        ) {
          fail();
          return;
        }
        if (!(await persistSessionResponse(session, { shouldPersist }))) {
          fail();
          return;
        }
        if (!shouldPersist()) {
          fail();
          return;
        }
        acceptConnection.current(session.address);
        setBrowserConnectorStatus("signed-in");
        // Offer wallet forwarding to this profile; never fails the sign-in.
        markBrowserWalletProfile(session.address).catch(() => undefined);
        setup?.onStatus("signed-in");
      } catch {
        fail();
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
