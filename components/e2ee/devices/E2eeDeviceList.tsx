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
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeDeviceInfo, E2eeEngine } from "@/lib/e2ee/types";
import {
  formatE2eeDate,
  formatE2eeDateTime,
  formatE2eeLastActive,
} from "../e2eeFormat";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import { useE2eeNow } from "../useE2eeNow";
import { RevokeThisBrowserDetails } from "./RevokeThisBrowserDetails";
import { E2eeDeviceApproval } from "./E2eeDeviceApproval";

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
  const zone = useDisplayTimeZone();
  const now = useE2eeNow();
  // Endings are dates only, as on Devices & security, with the
  // day taken in the display time zone.
  let ending: string;
  if (device.revokedAt !== null) {
    ending = t(locale, "e2ee.devices.revokedOn", {
      date: formatE2eeDate(locale, device.revokedAt, zone),
    });
  } else if (device.expiresAt <= now) {
    ending = t(locale, "e2ee.devices.expired", {
      date: formatE2eeDate(locale, device.expiresAt, zone),
    });
  } else {
    ending = t(locale, "e2ee.devices.expires", {
      date: formatE2eeDate(locale, device.expiresAt, zone),
    });
  }
  return (
    <ul className="tw-m-0 tw-mt-1 tw-flex tw-list-none tw-flex-wrap tw-gap-x-3 tw-gap-y-0.5 tw-p-0 tw-text-xs tw-text-iron-400">
      <li>
        {t(locale, "e2ee.devices.created", {
          date: formatE2eeDateTime(locale, device.createdAt, zone),
        })}
      </li>
      <li>
        {formatE2eeLastActive(
          locale,
          // Only while its permission is in force, as on Devices & security.
          device.isThisDevice &&
            device.revokedAt === null &&
            device.expiresAt > now,
          device.lastSeenAt,
          zone
        )}
      </li>
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
  readonly engine?: E2eeEngine | null | undefined;
  readonly onRevoke?: ((device: E2eeDeviceInfo) => void) | undefined;
}

function E2eeDeviceRow({ device, engine, onRevoke }: E2eeDeviceRowProps) {
  const locale = useBrowserLocale();
  const Icon = PLATFORM_ICONS[device.platform];
  const isActive = device.revokedAt === null;
  return (
    <li className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3">
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
        <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-300">
          {t(
            locale,
            device.linkedAuthorProof
              ? "e2ee.devices.combinedPermissions"
              : "e2ee.devices.permission"
          )}
        </p>
        <DeviceDates device={device} />
        <E2eeDeviceApproval device={device} engine={engine ?? null} />
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
  /** "Set up backup first" when revoking this browser with backup off. */
  readonly onSetUpBackup?: (() => void) | undefined;
}

interface RevokeCopy {
  readonly title: string;
  readonly body: string;
  readonly confirm: string;
}

/** The browser in use gets its own wording: it is the one you're using now. */
function getRevokeCopy(
  locale: SupportedLocale,
  target: E2eeDeviceInfo | null
): RevokeCopy {
  const label = target?.label ?? "";
  if (target?.isThisDevice) {
    return {
      title: t(locale, "e2ee.devices.revokeThisTitle"),
      body: t(locale, "e2ee.devices.revokeThisConfirmBody", { label }),
      confirm: t(locale, "e2ee.devices.revokeThisConfirm"),
    };
  }
  return {
    title: t(
      locale,
      target?.linkedAuthorProof
        ? "e2ee.devices.revokeCombinedTitle"
        : "e2ee.devices.revokeEncryptionTitle",
      { label }
    ),
    body: t(locale, "e2ee.devices.revokeHistory"),
    confirm: t(locale, "e2ee.devices.revokeConfirm"),
  };
}

/** Active devices first (this device on top), then revoked ones. */
export function E2eeDeviceList({
  devices,
  engine,
  onRevoked,
  onSetUpBackup,
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
  const revokeCopy = getRevokeCopy(locale, target);

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
            engine={engine}
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
        title={revokeCopy.title}
        body={revokeCopy.body}
        confirmLabel={revokeCopy.confirm}
        errorFallbackKey="e2ee.devices.revokeFailed"
        onConfirm={async () => {
          if (!engine || !target) {
            return;
          }
          await engine.revokeDevice(target.deviceKey);
          onRevoked?.(target);
        }}
        onClose={() => setTarget(null)}
      >
        {target?.isThisDevice ? (
          <RevokeThisBrowserDetails
            signedPosts={target.linkedAuthorProof === true}
            encryptedDms
            setUpBackup={
              onSetUpBackup
                ? {
                    onClick: () => {
                      setTarget(null);
                      onSetUpBackup();
                    },
                  }
                : null
            }
          />
        ) : null}
      </E2eeConfirmDialog>
    </>
  );
}
