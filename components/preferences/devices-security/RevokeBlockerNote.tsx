"use client";

import { useDeviceSecurityState } from "@/components/device-signing/DeviceSecurityStatus";
import {
  getDeviceSetupScope,
  getDeviceSetupTitleKey,
  openDeviceSetup,
} from "@/components/device-signing/deviceSetup";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { RevokeBlocker } from "./useSecurityDevices";

const REASONS: Record<RevokeBlocker, MessageKey> = {
  loading: "devicesSecurity.blocked.loading",
  elsewhere: "devicesSecurity.blocked.elsewhere",
  failed: "devicesSecurity.blocked.failed",
  "needs-dms": "devicesSecurity.blocked.needsDms",
  "device-limit": "devicesSecurity.blocked.deviceLimit",
  unsupported: "devicesSecurity.blocked.unsupported",
  "no-wallet": "devicesSecurity.blocked.noWallet",
};

/**
 * In place of Revoke on a device that holds encrypted DMs, while this
 * browser can't sign its revocation: why, and the one step that helps.
 */
export function RevokeBlockerNote({
  blocker,
}: {
  readonly blocker: RevokeBlocker;
}) {
  const locale = useBrowserLocale();
  const { restart, takeOverHere } = useE2ee();
  const { proof, canEnableEncryption } = useDeviceSecurityState();
  const setupScope = getDeviceSetupScope(proof, canEnableEncryption);

  let action: { readonly label: string; readonly run: () => void } | null =
    null;
  if (blocker === "elsewhere") {
    action = { label: t(locale, "e2ee.gate.elsewhere.action"), run: takeOverHere };
  } else if (blocker === "failed") {
    action = { label: t(locale, "e2ee.action.retry"), run: restart };
  } else if (
    blocker === "needs-dms" &&
    (setupScope === "both" || setupScope === "dms")
  ) {
    action = {
      label: t(locale, getDeviceSetupTitleKey(setupScope, false)),
      run: () => openDeviceSetup(setupScope),
    };
  }

  return (
    <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-2 sm:tw-w-auto sm:tw-max-w-xs sm:tw-flex-col sm:tw-items-end">
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400 sm:tw-text-right">
        {t(locale, REASONS[blocker])}
      </p>
      {action ? (
        <Button variant="secondary" size="xs" onClick={action.run}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
