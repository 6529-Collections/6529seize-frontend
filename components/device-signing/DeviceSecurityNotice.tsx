"use client";

import { E2eeBanner } from "@/components/e2ee/ui/E2eeBanner";
import { E2eeConfirmDialog } from "@/components/e2ee/ui/E2eeConfirmDialog";
import Button from "@/components/utils/button/Button";
import type { ApiDeviceSecurityNotice } from "@/generated/models/ApiDeviceSecurityNotice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  acknowledgeDeviceGrant,
  acknowledgeEncryptedDmDevice,
  revokeDeviceGrant,
} from "@/services/api/device-grants-api";
import { useId, useState } from "react";

interface DeviceSecurityNoticeProps {
  readonly notice: ApiDeviceSecurityNotice;
  readonly onHandled: (notice: ApiDeviceSecurityNotice) => Promise<void>;
  readonly revokeEncryptedDevice?: (deviceKey: string) => Promise<void>;
}

export function DeviceSecurityNotice({
  notice,
  onHandled,
  revokeEncryptedDevice,
}: DeviceSecurityNoticeProps) {
  const locale = useBrowserLocale();
  const noticeId = useId();
  const revokeUnavailableId = useId();
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledgeFailed, setAcknowledgeFailed] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const {
    device_label: label,
    signing_grant_id: grantId,
    encrypted_dm_device_key: encryptedDeviceKey,
  } = notice;
  const signedPostsPermission = encryptedDeviceKey ? "both" : "posts";
  const permission = grantId ? signedPostsPermission : "encryptedDms";
  const revokeUnavailable = !grantId && !revokeEncryptedDevice;

  const acknowledge = async () => {
    setAcknowledging(true);
    setAcknowledgeFailed(false);
    try {
      if (grantId) {
        await acknowledgeDeviceGrant(grantId);
      } else if (encryptedDeviceKey) {
        await acknowledgeEncryptedDmDevice(encryptedDeviceKey);
      }
      await onHandled(notice);
    } catch {
      setAcknowledgeFailed(true);
    } finally {
      setAcknowledging(false);
    }
  };

  const revoke = async () => {
    if (grantId) {
      await revokeDeviceGrant(grantId);
    } else if (encryptedDeviceKey && revokeEncryptedDevice) {
      await revokeEncryptedDevice(encryptedDeviceKey);
    }
    await onHandled(notice);
  };

  return (
    <>
      <div role="group" aria-labelledby={noticeId}>
        <E2eeBanner
          tone="warning"
          live={false}
          action={
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={acknowledging}
                onClick={() => void acknowledge()}
                aria-label={t(
                  locale,
                  "deviceSecurity.notice.acknowledgeLabel",
                  {
                    label,
                  }
                )}
              >
                {t(locale, "signedMessages.notice.newDevice.acknowledge")}
              </Button>
              <Button
                variant="destructiveOutline"
                size="sm"
                disabled={acknowledging || revokeUnavailable}
                aria-describedby={
                  revokeUnavailable ? revokeUnavailableId : undefined
                }
                onClick={() => setConfirmRevoke(true)}
                aria-label={t(locale, "deviceSecurity.notice.revokeLabel", {
                  label,
                })}
              >
                {t(locale, "signedMessages.notice.newDevice.revoke")}
              </Button>
            </>
          }
        >
          <span id={noticeId} role="alert">
            {t(locale, `deviceSecurity.notice.${permission}`, { label })}
          </span>
          {revokeUnavailable && (
            <p id={revokeUnavailableId} className="tw-mb-0 tw-mt-1 tw-text-xs">
              {t(locale, "deviceSecurity.notice.revokeUnavailable")}
            </p>
          )}
          {acknowledgeFailed && (
            <p
              role="alert"
              className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-rose-300"
            >
              {t(locale, "signedMessages.notice.newDevice.acknowledgeError")}
            </p>
          )}
        </E2eeBanner>
      </div>
      <E2eeConfirmDialog
        open={confirmRevoke}
        title={t(locale, "deviceSecurity.notice.revokeTitle", { label })}
        body={t(locale, `deviceSecurity.notice.revoke.${permission}`)}
        confirmLabel={t(locale, "signedMessages.notice.newDevice.revoke")}
        errorFallbackKey="e2ee.devices.revokeFailed"
        onConfirm={revoke}
        onClose={() => setConfirmRevoke(false)}
      />
    </>
  );
}
