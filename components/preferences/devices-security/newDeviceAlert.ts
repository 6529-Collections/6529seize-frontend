import { formatE2eeDateTime } from "@/components/e2ee/e2eeFormat";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

/** What a newly set-up device can do as this profile. */
export type NewDeviceReach = "both" | "posts" | "dms";

const BODY_KEYS: Record<NewDeviceReach, MessageKey> = {
  both: "devicesSecurity.newDevice.both",
  posts: "devicesSecurity.newDevice.posts",
  dms: "devicesSecurity.newDevice.dms",
};

/**
 * The one new-device alert's words, wherever it shows (above the composer,
 * in the encrypted inbox, on Devices & security): the device's name, then
 * everything it can now do and when it was set up.
 */
export function getNewDeviceAlertCopy(
  locale: SupportedLocale,
  {
    label,
    createdAt,
    reach,
  }: {
    readonly label: string;
    readonly createdAt: number;
    readonly reach: NewDeviceReach;
  }
): { readonly title: string; readonly body: string } {
  return {
    title: t(locale, "devicesSecurity.newDevice.title", { label }),
    body: t(locale, BODY_KEYS[reach], {
      date: formatE2eeDateTime(locale, createdAt),
    }),
  };
}
