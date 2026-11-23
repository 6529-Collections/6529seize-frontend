import { t, type MessageKey } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";

export type BackupPillState =
  | "on"
  | "off"
  | "available"
  | "uploading"
  | "unknown"
  | "unavailable";

const PILLS: Record<
  BackupPillState,
  { readonly key: MessageKey; readonly className: string }
> = {
  on: {
    key: "devicesSecurity.backup.pill.on",
    className: "tw-bg-emerald-500/10 tw-text-emerald-300",
  },
  off: {
    key: "devicesSecurity.backup.pill.off",
    className: "tw-bg-amber-500/10 tw-text-amber-200",
  },
  available: {
    key: "devicesSecurity.backup.pill.available",
    className: "tw-bg-amber-500/10 tw-text-amber-200",
  },
  uploading: {
    key: "devicesSecurity.backup.pill.uploading",
    className: "tw-bg-primary-500/15 tw-text-primary-300",
  },
  unknown: {
    key: "devicesSecurity.backup.pill.unknown",
    className: "tw-bg-iron-800 tw-text-iron-300",
  },
  unavailable: {
    key: "devicesSecurity.backup.pill.unavailable",
    className: "tw-bg-iron-800 tw-text-iron-300",
  },
};

/** The backup's state in one word; the words carry it, never color alone. */
export function BackupStatusPill({
  locale,
  state,
}: {
  readonly locale: SupportedLocale;
  readonly state: BackupPillState;
}) {
  const pill = PILLS[state];
  return (
    <span
      className={`tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold ${pill.className}`}
    >
      {t(locale, pill.key)}
    </span>
  );
}
