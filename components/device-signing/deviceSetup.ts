import type { MessageKey } from "@/i18n/messages";

export type DeviceSetupScope = "both" | "posts" | "dms";

export function getDeviceSetupScope(
  proof: string,
  canEnableEncryption: boolean
): DeviceSetupScope | null {
  const canEnableProof = proof === "off" || proof === "expired";
  if (canEnableProof) return canEnableEncryption ? "both" : "posts";
  return canEnableEncryption ? "dms" : null;
}

export const DEVICE_SETUP_TITLE: Record<DeviceSetupScope, MessageKey> = {
  both: "e2ee.deviceStatus.enableBoth",
  posts: "e2ee.deviceStatus.enableProof",
  dms: "e2ee.deviceStatus.enableEncryption",
};

export const DEVICE_SETUP_EVENT = "6529:device-setup";

export function openDeviceSetup(scope: DeviceSetupScope) {
  window.dispatchEvent(
    new CustomEvent<DeviceSetupScope>(DEVICE_SETUP_EVENT, { detail: scope })
  );
}
