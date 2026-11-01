"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
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

/**
 * "{label} can now read your encrypted messages. Not you? Revoke." for each
 * device of this profile that appeared since the user last saw the list.
 */
export function E2eeNewDeviceNotice({
  className = "",
}: {
  readonly className?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const { engine, devices, profileId, status } = useE2ee();
  const { newDevices, acknowledge } = useE2eeNewDevices(
    profileId,
    devices,
    status === "ready" || status === "device-limit"
  );
  const [target, setTarget] = useState<E2eeDeviceInfo | null>(null);

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
                {t(locale, "e2ee.devices.revoke")}
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => acknowledge(device.deviceKey)}
              >
                {t(locale, "e2ee.devices.newDeviceConfirm")}
              </Button>
            </>
          }
        >
          {t(locale, "e2ee.devices.newDevice", {
            label: device.label,
            platform: t(locale, PLATFORM_KEYS[device.platform]),
            date: formatE2eeDateTime(locale, device.createdAt),
          })}
        </E2eeBanner>
      ))}
      <E2eeConfirmDialog
        open={target !== null}
        title={t(locale, "e2ee.devices.revokeConfirmTitle", {
          label: target?.label ?? "",
        })}
        body={t(locale, "e2ee.devices.revokeConfirmBody")}
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
