"use client";

import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getDeviceKeyFingerprint } from "@/lib/device-signing/grant-message";
import { useDeviceGrants } from "@/hooks/device-signing/useDeviceGrants";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { useEffect } from "react";
import {
  importAcknowledgedDeviceGrants,
  useSignedMessagesNoticeState,
} from "./signedMessagesNoticeStorage";

/**
 * The grant that raises the new-device alert in this browser, or null. Each
 * browser shows a newly authorized device once, until it is dismissed there:
 * the grant is active, not one of this browser's keys, and neither it nor
 * an earlier grant of the same device key (a renewal) was already seen or
 * baselined here.
 */
export function findUnseenNewDeviceGrant(
  grants: readonly ApiDeviceGrant[],
  seen: ReadonlySet<string>,
  ownKeys: ReadonlySet<string>,
  nowMs: number
): ApiDeviceGrant | null {
  const seenKeys = new Set(
    grants
      .filter((grant) => seen.has(grant.id))
      .map((grant) => grant.device_key.toLowerCase())
  );
  return (
    grants.find((grant) => {
      const key = grant.device_key.toLowerCase();
      return (
        grant.revoked_at === null &&
        grant.expires_at > nowMs &&
        !seen.has(grant.id) &&
        !seenKeys.has(key) &&
        !ownKeys.has(key)
      );
    }) ?? null
  );
}

/**
 * Once per browser and wallet, when it first runs this logic: the grants
 * already acknowledged on 6529.io join this browser's seen grants, so
 * devices dismissed before are not announced again. The server's flag is
 * not read after that. Returns whether that has happened.
 */
export function useImportAcknowledgedDeviceGrants(): boolean {
  const address = useSignedMessagesAccount();
  const { data: grants } = useDeviceGrants(address);
  const { acknowledgedImported } = useSignedMessagesNoticeState(address);
  useEffect(() => {
    if (address && grants && !acknowledgedImported) {
      importAcknowledgedDeviceGrants(
        address,
        grants
          .filter((grant) => grant.notice_acknowledged === true)
          .map((grant) => grant.id)
      );
    }
  }, [acknowledgedImported, address, grants]);
  return acknowledgedImported === true;
}

/**
 * Where the new device was authorized and a short form of its key, so the
 * user can tell a device of their own from one they never added.
 */
export const getNewDeviceNoticeDetails = (
  locale: SupportedLocale,
  grant: ApiDeviceGrant
): string =>
  t(locale, "signedMessages.notice.newDevice.details", {
    origin: grant.domain,
    fingerprint: getDeviceKeyFingerprint(grant.device_key),
  });
