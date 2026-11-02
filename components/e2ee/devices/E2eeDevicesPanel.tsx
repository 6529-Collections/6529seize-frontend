"use client";

import { type FormEvent, useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { E2eeBackupPanel } from "../backup/E2eeBackupPanel";
import { E2eeDeviceList } from "./E2eeDeviceList";
import { E2eeNewDeviceNotice } from "./E2eeNewDeviceNotice";

const DEVICE_LABEL_MAX = 48;

function RenameThisDevice() {
  const locale = useBrowserLocale();
  const { engine, thisDevice } = useE2ee();
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resultKey, setResultKey] = useState<MessageKey | null>(null);

  if (!engine || !thisDevice) {
    return null;
  }
  const value = draft ?? thisDevice.label;
  const trimmed = value.trim();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || trimmed === thisDevice.label) {
      return;
    }
    setPending(true);
    setResultKey(null);
    try {
      await engine.renameThisDevice(trimmed);
      setDraft(null);
      setResultKey("e2ee.devices.rename.saved");
    } catch {
      setResultKey("e2ee.devices.rename.failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end"
    >
      <div className="tw-min-w-0 tw-flex-1">
        <label
          htmlFor={inputId}
          className="tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
        >
          {t(locale, "e2ee.devices.rename.label")}
        </label>
        <input
          id={inputId}
          value={value}
          maxLength={DEVICE_LABEL_MAX}
          onChange={(event) => {
            setDraft(event.target.value);
            setResultKey(null);
          }}
          className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        size="md"
        loading={pending}
        disabled={!trimmed || trimmed === thisDevice.label}
      >
        {t(locale, "e2ee.devices.rename.save")}
      </Button>
      <span
        role="status"
        className="tw-text-xs tw-text-iron-400 sm:tw-self-center"
      >
        {resultKey ? t(locale, resultKey) : null}
      </span>
    </form>
  );
}

/** "Devices for encrypted messages": list, revoke, rename this device. */
export function E2eeDevicesPanel() {
  const locale = useBrowserLocale();
  const { devices, engine } = useE2ee();
  const [revokedLabel, setRevokedLabel] = useState<string | null>(null);

  return (
    <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-3xl tw-flex-col tw-gap-5 tw-px-4 tw-py-5">
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "e2ee.devices.description")}
      </p>
      <E2eeNewDeviceNotice />
      <E2eeBackupPanel />
      <RenameThisDevice />
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
