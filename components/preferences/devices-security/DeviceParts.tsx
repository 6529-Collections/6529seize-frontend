"use client";

import {
  ChevronDownIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { createElement, useId, useState, type ReactNode } from "react";
import {
  formatE2eeDate,
  formatE2eeLastActive,
  formatE2eeWallet,
} from "@/components/e2ee/e2eeFormat";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  isDeviceActive,
  type DevicePermission,
  type DevicePlatform,
  type SecurityDevice,
} from "./classifyDevices";

/**
 * For a button whose label is a sentence ("Turn on signed posts and
 * encrypted DMs"): it wraps inside a narrow card instead of widening it.
 */
export const WRAPPING_BUTTON =
  "tw-max-w-full !tw-whitespace-normal tw-text-center";

const PLATFORM_ICONS = {
  web: GlobeAltIcon,
  desktop: ComputerDesktopIcon,
  phone: DevicePhoneMobileIcon,
} as const;

export function PlatformIcon({ platform }: { readonly platform: DevicePlatform }) {
  // createElement: a variable component tag compiles safely under React Compiler.
  return createElement(PLATFORM_ICONS[platform], {
    "aria-hidden": true,
    className: "tw-size-5 tw-shrink-0 tw-text-iron-400",
  });
}

function Chip({
  active,
  children,
}: {
  readonly active: boolean;
  readonly children: ReactNode;
}) {
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-rounded-md tw-border tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium ${
        active
          ? "tw-border-solid tw-border-white/10 tw-bg-white/[0.06] tw-text-iron-100"
          : "tw-border-dashed tw-border-iron-700 tw-bg-transparent tw-text-iron-400"
      }`}
    >
      {children}
    </span>
  );
}

const isOn = (permission: DevicePermission | null) =>
  permission?.status === "active";

/** One chip per permission; a missing one shows dashed as "… off". */
export function PermissionChips({
  locale,
  device,
}: {
  readonly locale: SupportedLocale;
  readonly device: SecurityDevice;
}) {
  const posts = isOn(device.signedPosts);
  const dms = isOn(device.encryptedDms);
  return (
    <span className="tw-flex tw-flex-wrap tw-gap-1.5">
      <Chip active={posts}>
        {t(
          locale,
          posts ? "devicesSecurity.chip.posts" : "devicesSecurity.chip.postsOff"
        )}
      </Chip>
      <Chip active={dms}>
        {t(locale, dms ? "devicesSecurity.chip.dms" : "devicesSecurity.chip.dmsOff")}
      </Chip>
    </span>
  );
}

/** Permissions a device held, as a locale list ("Signed posts, Encrypted DMs"). */
function formatPermissionNames(
  locale: SupportedLocale,
  device: SecurityDevice
): string {
  const names: string[] = [];
  if (device.signedPosts) {
    names.push(t(locale, "devicesSecurity.chip.posts"));
  }
  if (device.encryptedDms) {
    names.push(t(locale, "devicesSecurity.chip.dms"));
  }
  return formatList(locale, names, { style: "short", type: "unit" });
}

/** "{label} · {permissions}" as one translatable line. */
export function formatDeviceWithPermissions(
  locale: SupportedLocale,
  device: SecurityDevice
): string {
  return t(locale, "devicesSecurity.labelWithPermissions", {
    label: device.label,
    permissions: formatPermissionNames(locale, device),
  });
}

/** "Set up … · Last active … · Expires …", plus the wallet when asked. */
export function DeviceMeta({
  locale,
  device,
  showWallet = false,
}: {
  readonly locale: SupportedLocale;
  readonly device: SecurityDevice;
  readonly showWallet?: boolean;
}) {
  // Days and times in the display time zone (Preferences → Time Zone).
  const zone = useDisplayTimeZone();
  const items: { readonly key: string; readonly text: string }[] = [
    {
      key: "set-up",
      text: t(locale, "devicesSecurity.setUp", {
        date: formatE2eeDate(locale, device.createdAt, zone),
      }),
    },
    {
      key: "last-active",
      text: formatE2eeLastActive(
        locale,
        // Active now only while a permission is in force here.
        device.isThisDevice && isDeviceActive(device),
        device.lastActiveAt,
        zone
      ),
    },
  ];
  if (device.expiresAt !== null) {
    items.push({
      key: "expires",
      text: t(locale, "e2ee.devices.expires", {
        date: formatE2eeDate(locale, device.expiresAt, zone),
      }),
    });
  }
  const wallet = showWallet ? formatE2eeWallet(device.wallet) : "";
  if (wallet) {
    items.push({
      key: "wallet",
      text: t(locale, "signedMessages.devices.wallet", { address: wallet }),
    });
  }
  return (
    <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-3 tw-gap-y-0.5 tw-p-0 tw-text-xs tw-text-iron-400">
      {items.map((item) => (
        <li key={item.key}>{item.text}</li>
      ))}
    </ul>
  );
}

/** A heading-sized disclosure with no default marker (F-19). */
export function Disclosure({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100"
      >
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-4 tw-shrink-0 tw-transition-transform motion-reduce:tw-transition-none ${
            open ? "" : "-tw-rotate-90"
          }`}
        />
        <span>{label}</span>
      </button>
      <div id={panelId} hidden={!open}>
        {open ? children : null}
      </div>
    </div>
  );
}
