import { hasE2eeEnrollmentMarker } from "@/components/e2ee/e2eeLocalState";
import { getE2eeDeviceLabel } from "@/components/e2ee/e2eeDeviceLabel";
import {
  readLastPersistentStorageResult,
  type PersistentStorageResult,
} from "@/lib/storage/persistent-storage";
import {
  reportDeviceKeyStoreLoss,
  type EncryptedStoreState,
} from "@/utils/monitoring/deviceSigningMonitoring";
import type { DeviceKeyLoss } from "./key-loss";

const MB = 1024 * 1024;

/** Coarse size buckets: enough to tell an empty store from a full disk. */
export function bucketBytes(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return "unknown";
  }
  const limits: ReadonlyArray<readonly [number, string]> = [
    [MB, "<1MB"],
    [10 * MB, "1-10MB"],
    [100 * MB, "10-100MB"],
    [1024 * MB, "100MB-1GB"],
    [10 * 1024 * MB, "1-10GB"],
  ];
  return limits.find(([limit]) => bytes < limit)?.[1] ?? ">=10GB";
}

/** Coarse age buckets for the grant note, in hours. */
export function bucketHours(hours: number | null): string {
  if (hours === null) {
    return "unknown";
  }
  if (hours < 1) return "<1h";
  if (hours < 24) return "1-24h";
  if (hours < 24 * 7) return "1-7d";
  return ">=7d";
}

async function readPersisted(): Promise<PersistentStorageResult | "unknown"> {
  try {
    const storage = (globalThis.navigator as Partial<Navigator> | undefined)
      ?.storage;
    if (typeof storage?.persisted !== "function") {
      return "unsupported";
    }
    return (await storage.persisted()) ? "granted" : "denied";
  } catch {
    return "unknown";
  }
}

async function readEstimate(): Promise<{
  readonly usage: string;
  readonly quota: string;
}> {
  try {
    const storage = (globalThis.navigator as Partial<Navigator> | undefined)
      ?.storage;
    if (typeof storage?.estimate !== "function") {
      return { usage: "unknown", quota: "unknown" };
    }
    const { usage, quota } = await storage.estimate();
    return { usage: bucketBytes(usage), quota: bucketBytes(quota) };
  } catch {
    return { usage: "unknown", quota: "unknown" };
  }
}

async function readEncryptedStoreState(
  ownProfileId: string | null
): Promise<EncryptedStoreState> {
  if (ownProfileId === null) {
    return "unknown";
  }
  if (!hasE2eeEnrollmentMarker(ownProfileId)) {
    return "not-enrolled";
  }
  try {
    const { getDefaultE2eeStorage } = await import("@/lib/e2ee/storage");
    const device = await getDefaultE2eeStorage().getDevice(ownProfileId);
    return device ? "present" : "empty";
  } catch {
    return "unknown";
  }
}

/**
 * Reports one detected loss of this browser's key store. The event carries
 * only coarse codes: the browser family and OS, whether storage is (and was)
 * persistent, bucketed storage use, whether the encrypted-messages store
 * emptied too, and how long ago the grant note was written. Never ids,
 * wallets, grants or keys. Never throws.
 */
export async function reportDeviceKeyLoss(loss: DeviceKeyLoss): Promise<void> {
  try {
    const [persisted, estimate, encryptedStore] = await Promise.all([
      readPersisted(),
      readEstimate(),
      readEncryptedStoreState(loss.ownProfileId),
    ]);
    reportDeviceKeyStoreLoss({
      browser: getE2eeDeviceLabel("web"),
      persisted,
      persistedBefore: readLastPersistentStorageResult() ?? "unknown",
      usage: estimate.usage,
      quota: estimate.quota,
      encryptedStore,
      hintAge: bucketHours(loss.hintAgeHours),
    });
  } catch {
    // Monitoring never changes what the user sees.
  }
}
