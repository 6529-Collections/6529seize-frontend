"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import { CompactMenu } from "@/components/compact-menu";
import { useDeviceSecurityState } from "@/components/device-signing/DeviceSecurityStatus";
import {
  getDeviceSetupScope,
  getDeviceSetupTitleKey,
  openDeviceSetup,
} from "@/components/device-signing/deviceSetup";
import { useE2eeUpgradeCount } from "@/components/e2ee/useE2eeUpgrade";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SecurityDevice } from "./classifyDevices";
import {
  DeviceMeta,
  PermissionChips,
  PlatformIcon,
  WRAPPING_BUTTON,
} from "./DeviceParts";

/** "Turn on …" for whichever permission this browser is missing. */
function TurnOnMissing() {
  const locale = useBrowserLocale();
  const { proof, canEnableEncryption } = useDeviceSecurityState();
  const { engine } = useE2ee();
  const upgrading = useE2eeUpgradeCount(engine) !== null;
  const scope = getDeviceSetupScope(proof, canEnableEncryption);
  if (!scope) {
    return null;
  }
  return (
    <Button
      variant="secondary"
      size="sm"
      className={WRAPPING_BUTTON}
      onClick={() => openDeviceSetup(scope)}
    >
      {t(locale, getDeviceSetupTitleKey(scope, upgrading))}
    </Button>
  );
}

/**
 * The browser in use, pinned first: its permissions, one last-active line,
 * the expiry date and the wallet once. Rename it here; revoking it is in
 * More, behind the stricter dialog.
 */
export function ThisDeviceCard({
  device,
  canRevoke,
  canRename,
  onRevoke,
  onRename,
}: {
  readonly device: SecurityDevice | null;
  readonly canRevoke: boolean;
  readonly canRename: boolean;
  readonly onRevoke: (device: SecurityDevice) => void;
  readonly onRename: (device: SecurityDevice) => void;
}) {
  const locale = useBrowserLocale();
  const titleId = useId();

  if (!device) {
    return (
      <section
        aria-label={t(locale, "devicesSecurity.thisDevice.label")}
        className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
      >
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "devicesSecurity.thisDevice.none")}
        </p>
        <div>
          <TurnOnMissing />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-500/30 tw-bg-iron-950 tw-p-4"
    >
      <div className="tw-flex tw-items-start tw-gap-3">
        <PlatformIcon platform={device.platform} />
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <h3
              id={titleId}
              className="tw-m-0 tw-min-w-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-50"
            >
              {device.label}
            </h3>
            <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-primary-300">
              {t(locale, "e2ee.devices.thisDevice")}
            </span>
          </div>
          <PermissionChips locale={locale} device={device} />
          <DeviceMeta locale={locale} device={device} showWallet />
        </div>
        {canRevoke ? (
          <CompactMenu
            aria-label={t(locale, "devicesSecurity.thisDevice.more")}
            autoFocusItem={false}
            triggerAsChild
            trigger={
              <button
                type="button"
                className="tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
              >
                <EllipsisHorizontalIcon aria-hidden="true" className="tw-size-5" />
              </button>
            }
            menuWidthClassName="tw-w-56"
            itemClassName="tw-min-h-11"
            items={[
              {
                id: "revoke",
                label: t(locale, "devicesSecurity.thisDevice.revoke"),
                onSelect: () => onRevoke(device),
              },
            ]}
          />
        ) : null}
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {canRename ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRename(device)}
          >
            {t(locale, "devicesSecurity.thisDevice.rename")}
          </Button>
        ) : null}
        <TurnOnMissing />
      </div>
    </section>
  );
}
