"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toDataURL } from "qrcode";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAppGrantSigner } from "@/components/auth/useAppGrantSigner";
import type { RequestSignedMessagesGrant } from "@/components/auth/authSignedMessagesGrant";
import SignedMessagesEnableStatus from "@/components/device-signing/SignedMessagesEnableStatus";
import Button from "@/components/utils/button/Button";
import { useEnableSignedMessages } from "@/hooks/device-signing/useEnableSignedMessages";
import type { ConnectionSetupTarget } from "@/lib/device-signing/connection-setup-envelope";
import { createConnectionShare } from "@/services/auth/session-v2.utils";
import { publicEnv } from "@/config/env";
import { t } from "@/i18n/messages";
import { HEADER_SHARE_LOCALE } from "./constants";

/** Source-side wallet approval. The receiving app never needs a live wallet. */
export default function DeviceConnectionShare({
  target,
  renderLink,
  footer,
}: {
  readonly target: ConnectionSetupTarget;
  readonly renderLink: (
    link: { readonly url: string; readonly qr: string },
    refresh: () => void,
    loading: boolean
  ) => ReactNode;
  readonly footer: ReactNode;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  const sign = useAppGrantSigner();
  const [link, setLink] = useState<{
    url: string;
    qr: string;
    expires: number;
    context: string;
  } | null>(null);
  const context = JSON.stringify([
    address?.toLowerCase(),
    connectedProfile?.id,
    activeProfileProxy?.id,
    target,
  ]);
  const activeLink = link?.context === context ? link : null;
  const latest = useRef(context);
  const mounted = useRef(true);
  useLayoutEffect(() => {
    latest.current = context;
  }, [context]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const requestGrant = useCallback<RequestSignedMessagesGrant>(
    async (options) => {
      if (!address || !connectedProfile?.id || activeProfileProxy !== null)
        return { success: false, reason: "unavailable" };
      const isCurrent = () => mounted.current && latest.current === context;
      try {
        const { prepareConnectionDeviceSetup } =
          await import("@/lib/device-signing/connection-setup");
        const prepared = await prepareConnectionDeviceSetup({
          wallet: address,
          profileId: connectedProfile.id,
          target,
          sign,
          isCurrent,
          onSignatureRequested: options?.onSignatureRequested,
        });
        if (!prepared) return { success: false, reason: "rejected" };
        if (!isCurrent()) return { success: false, reason: "context-changed" };
        const share = await createConnectionShare({
          targetClientType: target,
          encryptedDeviceSetup: prepared.envelope,
        });
        const expires = Date.parse(share.expires_at);
        if (
          share.address.toLowerCase() !== address.toLowerCase() ||
          share.role !== null ||
          share.target_client_type !== target ||
          !Number.isFinite(expires) ||
          expires <= Date.now()
        )
          throw new Error("Invalid device setup share");
        const scheme =
          target === "desktop"
            ? (publicEnv.CORE_SCHEME ?? "core6529")
            : (publicEnv.MOBILE_APP_SCHEME ?? "mobile6529");
        const route =
          target === "desktop"
            ? "navigate/accept-connection-sharing"
            : "share-connection";
        const query = new URLSearchParams({
          connection_share_code: share.connection_share_code,
          address: share.address,
        });
        const url = `${scheme}://${route}?${query.toString()}#device_setup_key=${prepared.secret}`;
        const qr =
          target === "native"
            ? await toDataURL(url, {
                errorCorrectionLevel: "M",
                margin: 4,
                width: 640,
              })
            : "";
        if (!isCurrent()) return { success: false, reason: "context-changed" };
        setLink({ url, qr, expires, context });
        return { success: true };
      } catch {
        return {
          success: false,
          reason: isCurrent() ? "sign-in-failed" : "context-changed",
        };
      }
    },
    [activeProfileProxy, address, connectedProfile, context, sign, target]
  );
  const onEnabled = useCallback(() => undefined, []);
  const flow = useEnableSignedMessages({ requestGrant, onEnabled });
  const { enable } = flow;
  const refresh = () => enable("connection-share");
  useEffect(() => {
    // Start after the wallet flow has its initial snapshot. Cancel the
    // scheduled start if the user backs out or React replays the mount.
    const start = setTimeout(() => enable("connection-share"), 0);
    return () => clearTimeout(start);
  }, [enable]);

  useEffect(() => {
    if (!link) return;
    const timeout = setTimeout(
      () => setLink(null),
      Math.max(0, link.expires - Date.now())
    );
    return () => clearTimeout(timeout);
  }, [link]);

  return (
    <>
      {activeLink && renderLink(activeLink, refresh, flow.isEnabling)}
      <SignedMessagesEnableStatus
        status={flow.status}
        onReconnect={flow.reconnect}
      />
      {!activeLink && !flow.isEnabling && (
        <Button variant="primary" size="md" onClick={refresh}>
          {t(HEADER_SHARE_LOCALE, "headerShare.connectionRefresh.action")}
        </Button>
      )}
      {footer}
    </>
  );
}
