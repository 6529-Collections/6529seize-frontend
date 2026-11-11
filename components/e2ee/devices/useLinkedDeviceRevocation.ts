"use client";

import { useAuth } from "@/components/auth/Auth";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import { useRemoveE2eeLocalData } from "../useRemoveE2eeLocalData";

/**
 * Revoking a signing grant that also enrolled an encrypted-messages device
 * (a combined grant), from Preferences. Revoking the grant alone revokes
 * that device without a signature, which no device can verify; so this
 * browser's engine signs the device's revocation first when it is ready.
 * Revoking this browser's own device removes its encrypted messages here
 * (the engine does it when it signed; otherwise the local removal does).
 * When signing another device's revocation was tried and did not succeed,
 * a notice says that device keeps its history until it is removed there.
 */
export function useLinkedDeviceRevocation() {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { engine, status, thisDevice } = useE2ee();
  const removeLocal = useRemoveE2eeLocalData();
  const ready = status === "ready" && engine !== null;

  /** `ownGrant`: the grant's signing key is this browser's. */
  const isThisBrowser = (device: ApiE2eeDevice, ownGrant: boolean): boolean =>
    ownGrant ||
    (thisDevice !== null &&
      thisDevice.deviceKey === device.device_key.toLowerCase());

  /** Dialog copy that promises deleting history only where it happens. */
  const historyKey = (device: ApiE2eeDevice, ownGrant: boolean): MessageKey => {
    if (isThisBrowser(device, ownGrant)) {
      return "e2ee.devices.revokeHistoryThis";
    }
    return ready
      ? "e2ee.devices.revokeHistory"
      : "e2ee.devices.revokeHistoryUnsigned";
  };

  /** Signs the device's revocation; false when it could not be signed here. */
  const sign = async (device: ApiE2eeDevice): Promise<boolean> => {
    if (!ready) {
      return false;
    }
    try {
      await engine.revokeDevice(device.device_key);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Completes a confirmed revoke: this browser's own device, when the engine
   * did not sign (and so did not clear) it, is removed locally. Another
   * device whose revocation this browser tried but failed to sign keeps its
   * history (the dialog promised deletion), so the user is told, by the
   * grant's label as in the revoke result. With encrypted messages off here
   * the dialog already said so.
   */
  const finish = async (
    device: ApiE2eeDevice,
    grant: { readonly own: boolean; readonly label: string },
    signed: boolean
  ): Promise<void> => {
    if (signed) {
      return;
    }
    if (isThisBrowser(device, grant.own)) {
      await removeLocal?.();
    } else if (ready) {
      setToast({
        type: "warning",
        message: t(locale, "e2ee.devices.revokeUnsignedNotice", {
          label: grant.label,
        }),
      });
    }
  };

  return { historyKey, sign, finish };
}
