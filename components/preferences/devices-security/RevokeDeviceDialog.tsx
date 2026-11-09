"use client";

import { requestE2eeBackupSetup } from "@/components/e2ee/backup/backupSetupRequest";
import { RevokeThisBrowserDetails } from "@/components/e2ee/devices/RevokeThisBrowserDetails";
import { E2eeConfirmDialog } from "@/components/e2ee/ui/E2eeConfirmDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { SecurityDevice } from "./classifyDevices";
import { DeviceMeta } from "./DeviceParts";
import { DeviceActionUnavailableError } from "./useSecurityDevices";

const isOn = (device: SecurityDevice, key: "signedPosts" | "encryptedDms") =>
  device[key]?.status === "active";

function getScopeKey(device: SecurityDevice): MessageKey {
  const posts = isOn(device, "signedPosts");
  const dms = isOn(device, "encryptedDms");
  if (posts && dms) {
    return "devicesSecurity.revoke.both";
  }
  return dms ? "devicesSecurity.revoke.dms" : "devicesSecurity.revoke.posts";
}

function getCopy(locale: SupportedLocale, device: SecurityDevice | null) {
  const label = device?.label ?? "";
  if (device?.isThisDevice) {
    return {
      title: t(locale, "e2ee.devices.revokeThisTitle"),
      body: t(locale, "e2ee.devices.revokeThisConfirmBody", { label }),
      confirm: t(locale, "e2ee.devices.revokeThisConfirm"),
    };
  }
  return {
    title: t(locale, "devicesSecurity.revoke.title", { label }),
    body: device ? t(locale, getScopeKey(device)) : "",
    confirm: t(locale, "e2ee.devices.revokeConfirm"),
  };
}

const getErrorKey = (error: unknown): MessageKey =>
  error instanceof DeviceActionUnavailableError
    ? "devicesSecurity.revokeUnavailable"
    : "e2ee.devices.revokeFailed";

/**
 * Confirms one revoke. The browser in use gets the stricter dialog: it can
 * delete the encrypted chats saved here, so it says whether a backup keeps
 * them and offers to set backup up first.
 */
export function RevokeDeviceDialog({
  device,
  localKeysUnreadable,
  onRevoke,
  onClose,
}: {
  readonly device: SecurityDevice | null;
  readonly localKeysUnreadable: boolean;
  readonly onRevoke: (device: SecurityDevice) => Promise<void>;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const copy = getCopy(locale, device);
  return (
    <E2eeConfirmDialog
      open={device !== null}
      title={copy.title}
      body={copy.body}
      confirmLabel={copy.confirm}
      errorKeyFor={getErrorKey}
      onConfirm={async () => {
        if (device) {
          await onRevoke(device);
        }
      }}
      onClose={onClose}
    >
      {device ? (
        <>
          <DeviceMeta locale={locale} device={device} />
          {device.isThisDevice ? (
            <RevokeThisBrowserDetails
              signedPosts={isOn(device, "signedPosts")}
              encryptedDms={isOn(device, "encryptedDms")}
              setUpBackup={{
                onClick: () => {
                  onClose();
                  requestE2eeBackupSetup();
                },
              }}
            />
          ) : (
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "devicesSecurity.revoke.after")}
            </p>
          )}
          {localKeysUnreadable ? (
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
              {t(locale, "signedMessages.devices.revokeMaybeThisDevice")}
            </p>
          ) : null}
        </>
      ) : null}
    </E2eeConfirmDialog>
  );
}
