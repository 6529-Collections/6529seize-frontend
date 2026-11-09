"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getNewDeviceAlertCopy } from "@/components/preferences/devices-security/newDeviceAlert";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import {
  useAcknowledgeDeviceGrant,
  useDeviceGrants,
} from "@/hooks/device-signing/useDeviceGrants";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeDeviceInfo, E2eeEngine } from "@/lib/e2ee/types";
import { E2eeBanner } from "../ui/E2eeBanner";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import { useE2eeNewDevices } from "./useE2eeNewDevices";

/**
 * One alert for each device of this profile set up since this one, naming
 * everything it can now do. A device set up for signed posts and encrypted
 * DMs together raises this one alert, not one per permission.
 */
export function E2eeNewDeviceNotice({
  className = "",
}: {
  readonly className?: string | undefined;
}) {
  const { engine, devices, profileId, status } = useE2ee();
  const { newDevices, acknowledge } = useE2eeNewDevices(
    profileId,
    devices,
    status === "ready" || status === "device-limit"
  );

  if (newDevices.length === 0) {
    return null;
  }
  return (
    <NewDeviceAlerts
      className={className}
      devices={newDevices}
      engine={engine}
      onAcknowledge={acknowledge}
    />
  );
}

function NewDeviceAlerts({
  className,
  devices,
  engine,
  onAcknowledge,
}: {
  readonly className: string;
  readonly devices: readonly E2eeDeviceInfo[];
  readonly engine: E2eeEngine | null;
  readonly onAcknowledge: (deviceKey: string) => void;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  // The same device's signed-posts grant: its alert above the composer is
  // this alert, so answering either one answers both.
  const address = useSignedMessagesAccount();
  const { data: grants } = useDeviceGrants(address);
  const { acknowledge: acknowledgeGrant } = useAcknowledgeDeviceGrant();
  const [target, setTarget] = useState<E2eeDeviceInfo | null>(null);

  const linkedGrant = (device: E2eeDeviceInfo) =>
    device.authorProofGrantId === undefined
      ? undefined
      : grants?.find((grant) => grant.id === device.authorProofGrantId);
  const shown = devices.filter(
    (device) => linkedGrant(device)?.notice_acknowledged !== true
  );
  if (shown.length === 0 && target === null) {
    return null;
  }

  const itWasMe = (device: E2eeDeviceInfo) => {
    onAcknowledge(device.deviceKey);
    const grant = linkedGrant(device);
    if (grant?.revoked_at === null) {
      void acknowledgeGrant(grant.id);
    }
  };

  return (
    <div className={`tw-flex tw-flex-col tw-gap-2 ${className}`}>
      {shown.map((device) => {
        const copy = getNewDeviceAlertCopy(locale, {
          label: device.label,
          createdAt: device.createdAt,
          reach: device.linkedAuthorProof === true ? "both" : "dms",
        });
        return (
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
                  onClick={() => itWasMe(device)}
                >
                  {t(locale, "devicesSecurity.newDevice.itWasMe")}
                </Button>
              </>
            }
          >
            <p className="tw-m-0 tw-font-semibold">{copy.title}</p>
            <p className="tw-m-0">{copy.body}</p>
          </E2eeBanner>
        );
      })}
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
          onAcknowledge(target.deviceKey);
          // Revoking the device ends its signed-posts grant too.
          void queryClient.invalidateQueries({
            queryKey: [QueryKey.DEVICE_GRANTS],
          });
        }}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
