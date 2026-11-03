"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
import { useDeviceSecurityState } from "@/components/device-signing/DeviceSecurityStatus";
import SignedMessagesEnableStatus from "@/components/device-signing/SignedMessagesEnableStatus";
import Button from "@/components/utils/button/Button";
import { useEnableSignedMessages } from "@/hooks/device-signing/useEnableSignedMessages";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { getE2eeActionErrorKey, isE2eeSignatureRejection } from "../e2eeErrors";
import { E2eeBanner } from "../ui/E2eeBanner";

const dismissals = new Set<string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dismiss(key: string) {
  dismissals.add(key);
  for (const listener of listeners) listener();
}

interface RenewalBannerProps {
  readonly className?: string;
}

export function E2eeRenewalBanner(props: RenewalBannerProps) {
  return (
    <Suspense fallback={null}>
      <RenewalBannerRoute {...props} />
    </Suspense>
  );
}

function RenewalBannerRoute(props: RenewalBannerProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const inMessages =
    pathname === "/messages" || pathname?.startsWith("/messages/");
  const inWaves = pathname === "/waves" || pathname?.startsWith("/waves/");
  if (!inMessages && !inWaves) return null;
  return (
    <RenewalBannerContent
      {...props}
      inMessages={Boolean(inMessages)}
      preview={search?.get("showRenewal") === "true"}
    />
  );
}

function RenewalBannerContent({
  className,
  inMessages,
  preview,
}: RenewalBannerProps & {
  readonly inMessages: boolean;
  readonly preview: boolean;
}) {
  const locale = useBrowserLocale();
  const { engine, thisDevice, profileId } = useE2ee();
  const { proofGrant, proofRenewal, encryptionRenewal } =
    useDeviceSecurityState();
  const signing = useEnableSignedMessages();
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const proofDue = proofRenewal !== null && proofGrant !== null;
  const encryptionDue = encryptionRenewal !== null && thisDevice !== null;
  const combined =
    proofDue &&
    encryptionDue &&
    proofGrant.id === thisDevice.authorProofGrantId;
  const showProof = combined || (!inMessages && proofDue);
  const showEncryption = combined || (inMessages && encryptionDue);
  const previewOnly = preview && !showProof && !showEncryption;
  const proofKey = showProof ? proofGrant?.id : "";
  const encryptionKey = showEncryption
    ? `${thisDevice?.deviceKey}:${thisDevice?.expiresAt}`
    : "";
  const reminder = previewOnly
    ? `preview:${profileId ?? ""}`
    : `${profileId ?? ""}:${proofKey}:${encryptionKey}`;
  const dismissed = useSyncExternalStore(
    subscribe,
    () => dismissals.has(reminder),
    () => false
  );
  if ((!showProof && !showEncryption && !previewOnly) || dismissed) return null;

  const expiry = showEncryption
    ? thisDevice?.expiresAt
    : proofGrant?.expires_at;
  const expiryDate = expiry === undefined ? "" : formatDate(locale, expiry);
  const busy = pending || signing.isEnabling;
  let message: MessageKey = "e2ee.renew.body";
  if (combined) message = "e2ee.renew.inboxCombined";
  else if (showProof) message = "e2ee.renew.proofBody";
  else if (previewOnly) message = "e2ee.renew.preview";

  const renew = async () => {
    if (!engine) return;
    setPending(true);
    setErrorKey(null);
    try {
      await engine.enroll();
    } catch (error) {
      setErrorKey(
        isE2eeSignatureRejection(error)
          ? "e2ee.renew.rejected"
          : getE2eeActionErrorKey(error, "e2ee.renew.failed")
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <E2eeBanner
      tone="warning"
      live={false}
      className={className}
      action={
        <>
          {(showProof || previewOnly) && (
            <Button
              variant="secondary"
              size="xs"
              disabled={previewOnly || pending || !signing.canEnable}
              loading={signing.isEnabling}
              onClick={() => signing.enable("renew")}
            >
              {t(locale, "e2ee.renew.proofButton")}
            </Button>
          )}
          {(showEncryption || previewOnly) && (
            <Button
              variant="secondary"
              size="xs"
              disabled={previewOnly || signing.isEnabling || !engine}
              loading={pending}
              onClick={() => void renew()}
            >
              {t(locale, "e2ee.renew.inboxButton")}
            </Button>
          )}
          <Button
            variant="secondary"
            size="xs"
            aria-label={t(locale, "e2ee.renew.dismiss")}
            disabled={busy}
            onClick={() => dismiss(reminder)}
          >
            <XMarkIcon aria-hidden="true" className="tw-size-4" />
          </Button>
        </>
      }
    >
      <span>{t(locale, message, { date: expiryDate })}</span>
      {showProof && (
        <SignedMessagesEnableStatus
          status={signing.status}
          onReconnect={signing.reconnect}
          className="tw-mt-1"
        />
      )}
      {errorKey && (
        <span
          role={errorKey === "e2ee.renew.rejected" ? "status" : "alert"}
          className="tw-mt-1 tw-block"
        >
          {t(locale, errorKey, { date: expiryDate })}
        </span>
      )}
    </E2eeBanner>
  );
}
