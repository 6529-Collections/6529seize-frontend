"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toDataURL } from "qrcode";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAppGrantSigner } from "@/components/auth/useAppGrantSigner";
import type { RequestSignedMessagesGrant } from "@/components/auth/authSignedMessagesGrant";
import SignedMessagesEnableStatus from "@/components/device-signing/SignedMessagesEnableStatus";
import Button from "@/components/utils/button/Button";
import { useEnableSignedMessages } from "@/hooks/device-signing/useEnableSignedMessages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ConnectionSetupTarget } from "@/lib/device-signing/connection-setup-envelope";
import { createConnectionShare } from "@/services/auth/session-v2.utils";
import { publicEnv } from "@/config/env";

/** Source-side wallet approval. The receiving app never needs a live wallet. */
export default function DeviceConnectionShare({
  target,
  onBack,
}: {
  readonly target: ConnectionSetupTarget;
  readonly onBack: () => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  const sign = useAppGrantSigner();
  const [link, setLink] = useState<{
    url: string;
    qr: string;
    expires: number;
    context: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
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
        const qr = await toDataURL(url, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 360,
        });
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
  useEffect(() => {
    if (!link) return;
    const timeout = setTimeout(
      () => {
        setLink(null);
        setCopied(false);
      },
      Math.max(0, link.expires - Date.now())
    );
    return () => clearTimeout(timeout);
  }, [link]);
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-text-sm tw-text-iron-200">
      {activeLink ? (
        <>
          <p className="tw-m-0 tw-leading-6">
            {t(
              locale,
              target === "native"
                ? "e2ee.connectionSetup.scan"
                : "e2ee.connectionSetup.openInstruction"
            )}
          </p>
          {/* A generated data URL, never a remote image containing credentials. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeLink.qr}
            alt={t(locale, "e2ee.connectionSetup.qr")}
            className="tw-mx-auto tw-w-full tw-max-w-80 tw-rounded-lg"
          />
          {target === "desktop" ? (
            <a href={activeLink.url} className="tw-text-primary-300">
              {t(locale, "e2ee.connectionSetup.open")}
            </a>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(activeLink.url);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {t(
              locale,
              copied ? "headerShare.copy.copied" : "headerShare.copy.default"
            )}
          </Button>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-amber-200">
            {t(locale, "e2ee.connectionSetup.keepPrivate")}
          </p>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "e2ee.connectionSetup.restore")}
          </p>
        </>
      ) : (
        <>
          <p className="tw-m-0 tw-leading-6">
            {t(locale, "e2ee.connectionSetup.description")}
          </p>
          {target === "native" ? (
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "e2ee.connectionSetup.compatibility")}
            </p>
          ) : null}
          <Button
            variant="primary"
            size="md"
            disabled={activeProfileProxy !== null}
            loading={flow.isEnabling}
            onClick={() => flow.enable("connection-share")}
          >
            {t(locale, "e2ee.connectionSetup.approve")}
          </Button>
        </>
      )}
      <div className="tw-flex tw-flex-col">
        <SignedMessagesEnableStatus
          status={flow.status}
          onReconnect={flow.reconnect}
          className="tw-mb-3"
        />
        <Button
          variant="secondary"
          size="sm"
          className="!tw-whitespace-normal !tw-text-sm !tw-font-medium"
          onClick={onBack}
        >
          {t(locale, "e2ee.connectionSetup.back")}
        </Button>
      </div>
    </div>
  );
}
