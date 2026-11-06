"use client";

import { useState } from "react";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { E2eeBackupPanel } from "../backup/E2eeBackupPanel";
import { E2eeDeviceList } from "./E2eeDeviceList";
import { E2eeNewDeviceNotice } from "./E2eeNewDeviceNotice";
import { RenameDevice } from "./RenameDevice";

/** "Devices for encrypted messages": list, revoke, rename this device. */
export function E2eeDevicesPanel() {
  const locale = useBrowserLocale();
  const { devices, engine, thisDevice } = useE2ee();
  const [revokedLabel, setRevokedLabel] = useState<string | null>(null);

  return (
    <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-3xl tw-flex-col tw-gap-5 tw-px-4 tw-py-5">
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "e2ee.devices.description")}
      </p>
      <E2eeNewDeviceNotice />
      <E2eeBackupPanel />
      {engine && thisDevice && (
        <RenameDevice
          key={thisDevice.deviceKey}
          label={thisDevice.label}
          onRename={(name) => engine.renameThisDevice(name)}
        />
      )}
      <E2eeDeviceList
        devices={devices}
        engine={engine}
        onRevoked={(device) => setRevokedLabel(device.label)}
      />
      <p role="status" className="tw-sr-only">
        {revokedLabel ? t(locale, "e2ee.devices.revokeDone") : null}
      </p>
    </div>
  );
}
