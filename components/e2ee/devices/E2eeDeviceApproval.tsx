"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeDeviceInfo, E2eeEngine } from "@/lib/e2ee/types";
import { formatE2eeWallet } from "../e2eeFormat";

interface E2eeDeviceApprovalProps {
  readonly device: E2eeDeviceInfo;
  readonly engine: E2eeEngine | null;
}

/**
 * Another device of this profile that this device does not add to chats
 * yet (`needsApproval`): says so, with "Add device" when the engine can
 * approve it here. Renders nothing for any other device.
 */
export function E2eeDeviceApproval({
  device,
  engine,
}: E2eeDeviceApprovalProps) {
  const locale = useBrowserLocale();
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState(false);
  if (device.needsApproval !== true || device.revokedAt !== null) {
    return null;
  }
  const wallet = formatE2eeWallet(device.wallet);
  const add = async () => {
    if (!engine || adding) {
      return;
    }
    setAdding(true);
    setFailed(false);
    try {
      await engine.trustDevice(device.deviceKey);
    } catch {
      setFailed(true);
    } finally {
      setAdding(false);
    }
  };
  return (
    <div className="tw-mt-2 tw-rounded-md tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/10 tw-p-2 tw-text-xs tw-text-amber-100">
      <p className="tw-m-0 tw-font-semibold">
        {t(locale, "e2ee.devices.needsApproval")}
      </p>
      <p className="tw-m-0 tw-mt-1" title={device.wallet}>
        {wallet
          ? t(locale, "e2ee.devices.needsApprovalHint", { wallet })
          : t(locale, "e2ee.devices.needsApprovalHintNoWallet")}
      </p>
      {engine ? (
        <Button
          variant="secondary"
          size="xs"
          className="tw-mt-2"
          loading={adding}
          disabled={adding}
          onClick={() => void add()}
          aria-label={t(locale, "e2ee.banner.addDeviceAria", { wallet })}
        >
          {t(locale, "e2ee.banner.addDevice")}
        </Button>
      ) : null}
      {failed ? (
        <p role="alert" className="tw-m-0 tw-mt-1 tw-text-rose-200">
          {t(locale, "e2ee.banner.deviceActionFailed")}
        </p>
      ) : null}
    </div>
  );
}
