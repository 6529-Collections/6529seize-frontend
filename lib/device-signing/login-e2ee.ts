import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { PreparedLoginE2eeDevice } from "@/lib/e2ee/login-device";
import { withinTimeBudget } from "./time-budget";

/**
 * NC8: folds the encrypted-messages device grant into the sign-in grant.
 * The first sign-in on a browser can download the MLS module, so the key is
 * prepared within a budget; past it the sign-in grants signing only and
 * encrypted messages keep their own grant prompt.
 */
export type LoginE2eeDevice = PreparedLoginE2eeDevice;

const PREPARE_BUDGET_MS = 2000;

const canHoldE2eeDevice = (): boolean =>
  isE2eeEnabled() &&
  typeof WebAssembly === "object" &&
  typeof globalThis.indexedDB !== "undefined";

/** Never throws: any problem means a sign-in that grants signing only. */
export async function prepareLoginE2eeDevice(): Promise<LoginE2eeDevice | null> {
  if (!canHoldE2eeDevice()) {
    return null;
  }
  const task = import("@/lib/e2ee/login-device").then(
    async ({ createLoginE2eeDevice }) => await createLoginE2eeDevice()
  );
  try {
    const device = await withinTimeBudget(task, PREPARE_BUDGET_MS);
    if (!device) {
      // Too slow for this sign-in; release the key if it arrives later.
      task.then((late) => late.dispose()).catch(() => undefined);
    }
    return device;
  } catch {
    return null;
  }
}

export const toE2eeNonceParams = (
  device: LoginE2eeDevice
): { readonly mls_device_key: string; readonly mls_ciphersuite: string } => ({
  mls_device_key: device.deviceKeyHex,
  mls_ciphersuite: String(device.ciphersuite),
});
