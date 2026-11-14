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
  const { seizeAcceptConnection } = useSeizeConnectContext();
  const acceptConnection = useRef(seizeAcceptConnection);

  useEffect(() => {
    acceptConnection.current = seizeAcceptConnection;
  }, [seizeAcceptConnection]);

  useEffect(() => {
    const api = getDesktopShellApi();
    if (!api) return undefined;

    const signIn = async (payload: unknown) => {
      const result = parseBrowserConnectorResult(payload);
      if (!result || !takeBrowserConnectorRequest(result.requestId)) return;
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
        // The session must be for the wallet that signed (both lower-cased).
        if (session.address.toLowerCase() !== result.address.toLowerCase()) {
          setBrowserConnectorStatus("failed");
          return;
        }
        if (!(await persistSessionResponse(session))) {
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
      api.offWalletConnection?.(onWalletConnection);
    };
  }, []);

  return null;
}
