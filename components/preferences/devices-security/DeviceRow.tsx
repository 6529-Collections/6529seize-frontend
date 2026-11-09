"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SecurityDevice } from "./classifyDevices";
import {
  DeviceMeta,
  formatPermissionNames,
  PermissionChips,
  PlatformIcon,
} from "./DeviceParts";

/** One active device that isn't this browser, with its Revoke action. */
export function DeviceRow({
  device,
  canRevoke,
  onRevoke,
}: {
  readonly device: SecurityDevice;
  readonly canRevoke: boolean;
  readonly onRevoke: (device: SecurityDevice) => void;
}) {
  const locale = useBrowserLocale();
  return (
    <li className="tw-flex tw-flex-wrap tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <PlatformIcon platform={device.platform} />
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-basis-48 tw-flex-col tw-gap-2">
        <span className="tw-min-w-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-50">
          {device.label}
        </span>
        <PermissionChips locale={locale} device={device} />
        <DeviceMeta locale={locale} device={device} />
        {device.unverified ? (
          <p className="tw-m-0 tw-text-xs tw-text-amber-200">
            {t(locale, "devicesSecurity.unverified")}
          </p>
        ) : null}
      </div>
      {canRevoke ? (
        <Button
          variant="destructiveOutline"
          size="sm"
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

/** One line per ended device: what it held, when it was set up and ended. */
export function HistoryRow({ device }: { readonly device: SecurityDevice }) {
  const locale = useBrowserLocale();
  const revokedAt =
    device.signedPosts?.status === "revoked" ||
    device.encryptedDms?.status === "revoked";
  return (
    <li className="tw-flex tw-items-start tw-gap-3 tw-py-2">
      <PlatformIcon platform={device.platform} />
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-m-0 tw-break-words tw-text-sm tw-text-iron-200">
          {device.label}
          <span className="tw-text-iron-400">
            {" · "}
            {formatPermissionNames(locale, device)}
          </span>
        </p>
        <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-text-iron-400">
          {t(locale, "devicesSecurity.setUp", {
            date: formatDate(locale, device.createdAt),
          })}
          {" · "}
          {t(
            locale,
            revokedAt
              ? "devicesSecurity.history.revoked"
              : "devicesSecurity.history.expired",
            { date: formatDate(locale, device.endedAt ?? device.createdAt) }
          )}
        </p>
      </div>
    </li>
  );
}
