"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { CompactMenu } from "@/components/compact-menu";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SecurityDevice } from "./classifyDevices";
import { RevokeBlockerNote } from "./RevokeBlockerNote";
import type { RevokeBlocker } from "./useSecurityDevices";
import {
  DeviceMeta,
  formatDeviceWithPermissions,
  PermissionChips,
  PlatformIcon,
} from "./DeviceParts";

const MORE_TRIGGER_CLASS =
  "tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100";

/**
 * One active device that isn't this browser: Revoke, and Rename in More.
 * Where encrypted DMs block the revoke here, it says why instead.
 */
export function DeviceRow({
  device,
  canRevoke,
  revokeBlocker,
  canRename,
  onRevoke,
  onRename,
}: {
  readonly device: SecurityDevice;
  readonly canRevoke: boolean;
  readonly revokeBlocker: RevokeBlocker | null;
  readonly canRename: boolean;
  readonly onRevoke: (device: SecurityDevice) => void;
  readonly onRename: (device: SecurityDevice) => void;
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
      <div className="tw-flex tw-items-start tw-gap-1">
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
        {canRename ? (
          <CompactMenu
            aria-label={t(locale, "devicesSecurity.row.more", {
              label: device.label,
            })}
            autoFocusItem={false}
            triggerAsChild
            trigger={
              <button type="button" className={MORE_TRIGGER_CLASS}>
                <EllipsisHorizontalIcon aria-hidden="true" className="tw-size-5" />
              </button>
            }
            menuWidthClassName="tw-w-48"
            itemClassName="tw-min-h-11"
            items={[
              {
                id: "rename",
                label: t(locale, "devicesSecurity.row.rename"),
                onSelect: () => onRename(device),
              },
            ]}
          />
        ) : null}
      </div>
      {!canRevoke && revokeBlocker ? (
        <RevokeBlockerNote blocker={revokeBlocker} />
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
          {formatDeviceWithPermissions(locale, device)}
        </p>
        <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-text-iron-400">
          {t(
            locale,
            revokedAt
              ? "devicesSecurity.history.revoked"
              : "devicesSecurity.history.expired",
            {
              setUp: formatDate(locale, device.createdAt),
              ended: formatDate(locale, device.endedAt ?? device.createdAt),
            }
          )}
        </p>
      </div>
    </li>
  );
}
