"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { DeviceSecurityNotice } from "@/components/device-signing/DeviceSecurityNotice";
import {
  deviceSecurityNoticeKey,
  useDeviceSecurityNotices,
} from "@/hooks/device-signing/useDeviceSecurityNotices";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { formatE2eeDateTime } from "../e2eeFormat";
import { E2eeBanner } from "../ui/E2eeBanner";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import { useE2eeNewDevices } from "./useE2eeNewDevices";

const PLATFORM_KEYS: Record<E2eeDeviceInfo["platform"], MessageKey> = {
  web: "e2ee.devices.platform.web",
  desktop: "e2ee.devices.platform.desktop",
  phone: "e2ee.devices.platform.phone",
};

/** Mount account-scoped queries only while this surface has an owner session. */
export function E2eeNewDeviceNotice({
  className = "",
}: {
  readonly className?: string | undefined;
}) {
  const { activeProfileProxy, isAuthenticated } = useAuth();
  return isAuthenticated === true && !activeProfileProxy ? (
    <AuthenticatedE2eeDeviceNotice className={className} />
  ) : null;
}

function AuthenticatedE2eeDeviceNotice({
  className,
}: {
  readonly className: string;
}) {
  const locale = useBrowserLocale();
  const zone = useDisplayTimeZone();
  const { engine, devices, profileId, status, thisDevice } = useE2ee();
  const canShowNotices = status === "ready" || status === "device-limit";
  const { notices, removeNotice } = useDeviceSecurityNotices(canShowNotices);
  const { newDevices, acknowledge } = useE2eeNewDevices(
    profileId,
    devices,
    canShowNotices && notices === null
  );
  const [target, setTarget] = useState<E2eeDeviceInfo | null>(null);

  if (notices) {
    const pending = notices.filter(
      (notice) =>
        notice.encrypted_dm_device_key !== null &&
        notice.encrypted_dm_device_key.toLowerCase() !==
          thisDevice?.deviceKey.toLowerCase()
    );
    if (!pending.length) {
      return null;
    }
    return (
      <div className={`tw-flex tw-flex-col tw-gap-2 ${className}`}>
        {pending.map((notice) => (
          <DeviceSecurityNotice
            key={deviceSecurityNoticeKey(notice)}
            notice={notice}
            onHandled={removeNotice}
            {...(engine
              ? { revokeEncryptedDevice: (key) => engine.revokeDevice(key) }
              : {})}
          />
        ))}
      </div>
    );
  }

  if (newDevices.length === 0) {
    return null;
  }

  return (
    <div className={`tw-flex tw-flex-col tw-gap-2 ${className}`}>
      {newDevices.map((device) => (
        <E2eeBanner
          key={device.deviceKey}
          tone="warning"
          action={
            <>
              <Button
                variant="destructiveOutline"
                size="xs"
                onClick={() => setTarget(device)}
                aria-label={t(locale, "e2ee.devices.newDeviceRevoke", {
                  label: device.label,
                })}
              >
                {t(locale, "signedMessages.notice.newDevice.revoke")}
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => acknowledge(device.deviceKey)}
              >
                {t(locale, "signedMessages.notice.newDevice.acknowledge")}
              </Button>
            </>
          }
        >
          {t(locale, "e2ee.devices.newDevice", {
            label: device.label,
            platform: t(locale, PLATFORM_KEYS[device.platform]),
            date: formatE2eeDateTime(locale, device.createdAt, zone),
          })}
        </E2eeBanner>
      ))}
      <E2eeConfirmDialog
        open={target !== null}
        title={t(
          locale,
          target?.linkedAuthorProof
            ? "e2ee.devices.revokeCombinedTitle"
            : "e2ee.devices.revokeEncryptionTitle",
          {
            label: target?.label ?? "",
          }
        )}
        body={t(locale, "e2ee.devices.revokeHistory")}
        confirmLabel={t(locale, "e2ee.devices.revokeConfirm")}
        errorFallbackKey="e2ee.devices.revokeFailed"
        onConfirm={async () => {
          if (!engine || !target) {
            return;
          }
          await engine.revokeDevice(target.deviceKey);
          acknowledge(target.deviceKey);
        }}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
