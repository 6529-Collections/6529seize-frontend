"use client";

import { useE2ee } from "@/hooks/e2ee/useE2ee";
import type { MessageKey } from "@/i18n/messages";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import { useRemoveE2eeLocalData } from "../useRemoveE2eeLocalData";

/**
 * Revoking a signing grant that also enrolled an encrypted-messages device
 * (a combined grant), from Preferences. Revoking the grant alone revokes
 * that device without a signature, which no device can verify; so this
 * browser's engine signs the device's revocation first when it is ready.
 * Revoking this browser's own device removes its encrypted messages here
 * (the engine does it when it signed; otherwise the local removal does).
 */
export function useLinkedDeviceRevocation() {
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
   * did not sign (and so did not clear) it, is removed locally.
   */
  const finish = async (
    device: ApiE2eeDevice,
    ownGrant: boolean,
    signed: boolean
  ): Promise<void> => {
    if (!signed && isThisBrowser(device, ownGrant)) {
      await removeLocal?.();
    }
  };

  return { historyKey, sign, finish };
}
