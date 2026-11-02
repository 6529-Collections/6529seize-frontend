"use client";

import {
  CheckBadgeIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeDeviceInfo, E2eeEngine } from "@/lib/e2ee/types";
import { formatE2eeDateTime } from "../e2eeFormat";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import { useE2eeNow } from "../useE2eeNow";

const PLATFORM_KEYS: Record<E2eeDeviceInfo["platform"], MessageKey> = {
  web: "e2ee.devices.platform.web",
  desktop: "e2ee.devices.platform.desktop",
  phone: "e2ee.devices.platform.phone",
};

const PLATFORM_ICONS = {
  web: GlobeAltIcon,
  desktop: ComputerDesktopIcon,
  phone: DevicePhoneMobileIcon,
} as const;

function DeviceDates({ device }: { readonly device: E2eeDeviceInfo }) {
  const locale = useBrowserLocale();
  const now = useE2eeNow();
  const lastSeen =
    device.lastSeenAt === null
      ? t(locale, "e2ee.devices.lastSeenNever")
      : t(locale, "e2ee.devices.lastSeen", {
          date: formatE2eeDateTime(locale, device.lastSeenAt),
        });
  let ending: string;
  if (device.revokedAt !== null) {
    ending = t(locale, "e2ee.devices.revokedOn", {
      date: formatE2eeDateTime(locale, device.revokedAt),
    });
  } else if (device.expiresAt <= now) {
    ending = t(locale, "e2ee.devices.expired", {
      date: formatE2eeDateTime(locale, device.expiresAt),
    });
  } else {
    ending = t(locale, "e2ee.devices.expires", {
      date: formatE2eeDateTime(locale, device.expiresAt),
    });
  }
  return (
    <ul className="tw-m-0 tw-mt-1 tw-flex tw-list-none tw-flex-wrap tw-gap-x-3 tw-gap-y-0.5 tw-p-0 tw-text-xs tw-text-iron-400">
      <li>
        {t(locale, "e2ee.devices.created", {
          date: formatE2eeDateTime(locale, device.createdAt),
        })}
      </li>
      <li>{lastSeen}</li>
      <li>{ending}</li>
    </ul>
  );
}

function VerifiedIndicator({ verified }: { readonly verified: boolean }) {
  const locale = useBrowserLocale();
  if (verified) {
    return (
      <span
        className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-text-emerald-300"
        title={t(locale, "e2ee.devices.verifiedHint")}
      >
        <CheckBadgeIcon aria-hidden="true" className="tw-size-4" />
        {t(locale, "e2ee.devices.verified")}
        <span className="tw-sr-only">
          {t(locale, "e2ee.devices.verifiedHint")}
        </span>
      </span>
    );
  }
  return (
    <span
      className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-text-amber-200"
      title={t(locale, "e2ee.devices.unverifiedHint")}
    >
      <ExclamationTriangleIcon aria-hidden="true" className="tw-size-4" />
      {t(locale, "e2ee.devices.unverified")}
      <span className="tw-sr-only">
        {t(locale, "e2ee.devices.unverifiedHint")}
      </span>
    </span>
  );
}

interface E2eeDeviceRowProps {
  readonly device: E2eeDeviceInfo;
  readonly onRevoke?: ((device: E2eeDeviceInfo) => void) | undefined;
}

function E2eeDeviceRow({ device, onRevoke }: E2eeDeviceRowProps) {
  const locale = useBrowserLocale();
  const Icon = PLATFORM_ICONS[device.platform];
  const isActive = device.revokedAt === null;
  return (
    <li className="tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <Icon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0 tw-text-iron-400"
      />
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <span className="tw-min-w-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-50">
            {device.label}
          </span>
          <span className="tw-text-xs tw-text-iron-400">
            {t(locale, PLATFORM_KEYS[device.platform])}
          </span>
          {device.isThisDevice ? (
            <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-primary-300">
              {t(locale, "e2ee.devices.thisDevice")}
            </span>
          ) : null}
          <VerifiedIndicator verified={device.verified} />
        </div>
        <DeviceDates device={device} />
      </div>
      {isActive && onRevoke ? (
        <Button
          variant="destructiveOutline"
          size="xs"
          onClick={() => onRevoke(device)}
          aria-label={t(locale, "e2ee.devices.revokeAria", {
            label: device.label,
          })}
        >
          {t(locale, "e2ee.devices.revoke")}
        </Button>
      ) : null}
    </li>
  );
}

interface E2eeDeviceListProps {
  readonly devices: readonly E2eeDeviceInfo[];
  readonly engine: E2eeEngine | null;
  readonly onRevoked?: ((device: E2eeDeviceInfo) => void) | undefined;
}

/** Active devices first (this device on top), then revoked ones. */
export function E2eeDeviceList({
  devices,
  engine,
  onRevoked,
}: E2eeDeviceListProps) {
  const locale = useBrowserLocale();
  const [target, setTarget] = useState<E2eeDeviceInfo | null>(null);
  const active = devices
    .filter((device) => device.revokedAt === null)
    .toSorted(
      (a, b) =>
        Number(b.isThisDevice) - Number(a.isThisDevice) ||
        b.createdAt - a.createdAt
    );
  const revoked = devices.filter((device) => device.revokedAt !== null);

  if (devices.length === 0) {
    return (
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "e2ee.devices.empty")}
      </p>
    );
  }

  return (
    <>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        {active.map((device) => (
          <E2eeDeviceRow
            key={device.deviceKey}
            device={device}
            onRevoke={engine ? setTarget : undefined}
          />
        ))}
      </ul>
      {revoked.length > 0 ? (
        <section className="tw-mt-6">
          <h3 className="tw-m-0 tw-mb-2 tw-text-sm tw-font-semibold tw-text-iron-300">
            {t(locale, "e2ee.devices.revokedSection")}
          </h3>
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0 tw-opacity-80">
            {revoked.map((device) => (
              <E2eeDeviceRow key={device.deviceKey} device={device} />
            ))}
          </ul>
        </section>
      ) : null}
      <E2eeConfirmDialog
        open={target !== null}
        title={t(locale, "e2ee.devices.revokeConfirmTitle", {
          label: target?.label ?? "",
        })}
        body={t(
          locale,
          target?.isThisDevice
            ? "e2ee.devices.revokeThisConfirmBody"
            : "e2ee.devices.revokeConfirmBody"
        )}
        confirmLabel={t(locale, "e2ee.devices.revokeConfirm")}
        errorFallbackKey="e2ee.devices.revokeFailed"
        onConfirm={async () => {
          if (!engine || !target) {
            return;
          }
          await engine.revokeDevice(target.deviceKey);
          onRevoked?.(target);
        }}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
