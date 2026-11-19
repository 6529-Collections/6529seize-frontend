"use client";

import { RenameDevice } from "@/components/e2ee/devices/RenameDevice";
import { E2eeDialog } from "@/components/e2ee/ui/E2eeDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SecurityDevice } from "./classifyDevices";

/** Renames one device; the name is shared by all the profile's devices. */
export function RenameDeviceDialog({
  device,
  onRename,
  onClose,
}: {
  readonly device: SecurityDevice | null;
  readonly onRename: (device: SecurityDevice, name: string) => Promise<void>;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <E2eeDialog
      open={device !== null}
      onClose={onClose}
      title={t(
        locale,
        device?.isThisDevice
          ? "devicesSecurity.thisDevice.renameTitle"
          : "devicesSecurity.rename.title",
        { label: device?.label ?? "" }
      )}
      closeLabel={t(locale, "e2ee.action.close")}
    >
      {device ? (
        <RenameDevice
          key={device.id}
          label={device.label}
          onRename={(name) => onRename(device, name)}
        />
      ) : null}
    </E2eeDialog>
  );
}
